import {
  Address,
  BigInt,
  Bytes,
  crypto,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  MessageReceived as MessageReceivedEvent,
  MessageSent as MessageSentEvent,
} from "../generated/L2USDCMessageTransmitter/L2USDCMessageTransmitter";
import { MessageReceived, MessageSent } from "../generated/schema";
import {
  Burn as BurnEvent,
} from "../generated/L2FiatToken/L2FiatToken"
import {
  Burn,
} from "../generated/schema"

function leftPadBytes(data: Bytes, length: number): Bytes {
  const completeData = new Bytes(length as i32);
  const zeroBytesToFillPrefix = completeData.length - data.length;
  for (let i = 0; i < completeData.length; i++) {
    if (i < zeroBytesToFillPrefix) {
      completeData[i] = 0;
    } else {
      completeData[i] = data[i - zeroBytesToFillPrefix];
    }
  }
  return completeData;
}

function getIdFromMessage(sourceDomain: BigInt, noncePadded: Bytes): Bytes {
  return Bytes.fromHexString(
    `0${sourceDomain.toString()}${noncePadded.toHexString()}`,
  );
}

export function handleMessageReceived(event: MessageReceivedEvent): void {
  const nonce = event.params.nonce;
  const sourceDomain = event.params.sourceDomain;

  const noncePadded = leftPadBytes(
    Bytes.fromHexString("0x".concat(nonce.toHex().slice(2).padStart(8, "0"))),
    32,
  );
  const id = getIdFromMessage(sourceDomain, noncePadded);

  let entity = new MessageReceived(id);
  // Addresses are stored in 32 bytes, we need to remove the first 8 bytes of 0 before using `Address.fromBytes`
  // see https://developers.circle.com/stablecoin/docs/cctp-technical-reference#message
  const parsedSender = event.params.sender.slice(12);

  entity.caller = event.params.caller;
  entity.sourceDomain = event.params.sourceDomain;
  entity.nonce = event.params.nonce;
  entity.sender = Address.fromUint8Array(parsedSender);
  entity.messageBody = event.params.messageBody;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMessageSent(event: MessageSentEvent): void {
  // message is encoded with encodePacked, we need to pad non-bytes parameter (uint32, uint64) to 32 bytes (= 256 bits)
  const message = event.params.message;
  const versionSlice = message.slice(0, 4);
  const sourceDomainSlice = message.slice(4, 8);
  const destinationDomainSlice = message.slice(8, 12);
  const nonceSlice = message.subarray(12, 20);
  const recipientSlice = message.subarray(64, 84); // Skip the first 12 characters (We need 20 bytes addresses, but it's stored as 32 bytes)

  const versionPadded = leftPadBytes(Bytes.fromUint8Array(versionSlice), 32);
  const sourceDomainPadded = leftPadBytes(
    Bytes.fromUint8Array(sourceDomainSlice),
    32,
  );
  const destinationDomainPadded = leftPadBytes(
    Bytes.fromUint8Array(destinationDomainSlice),
    32,
  );
  const noncePadded = leftPadBytes(Bytes.fromUint8Array(nonceSlice), 32);
  const messagePadded = versionPadded
    .concat(sourceDomainPadded)
    .concat(destinationDomainPadded)
    .concat(noncePadded)
    .concat(Bytes.fromUint8Array(message.slice(20)));

  // version, sourceDomain, destinationDomain, nonce, sender, recipient, destinationCaller, messageBody
  // see https://developers.circle.com/stablecoin/docs/cctp-technical-reference#message
  const decodedData = ethereum.decode(
    "(uint32,uint32,uint32,uint64,bytes32,bytes32,bytes32)",
    messagePadded,
  );

  if (!decodedData) {
    return;
  }

  const decodedDataTuple = decodedData.toTuple();

  const sourceDomain = decodedDataTuple[1].toBigInt();
  const destinationDomain = decodedDataTuple[2].toBigInt();
  const nonce = decodedDataTuple[3].toBigInt();
  
  if (destinationDomain.notEqual(BigInt.fromI32(0))) {
    return;
  }

  const id = getIdFromMessage(sourceDomain, noncePadded);
  const entityFromStore = MessageSent.load(id);

  // Multiple MessageSent might have the same id when replaced with `replaceMessage`
  // We're only interested in the most recent one
  // Events might not arrive in order, we need to compare timestamp to get the most recent one
  if (entityFromStore) {
    // If the new MessageSent is more recent, override the one in store
    // If the MessageEvent in the store is the most recent, skip
    if (entityFromStore.blockTimestamp.gt(event.block.timestamp)) {
      return;
    }
  }

  const entity = new MessageSent(id);
  const recipient = Bytes.fromUint8Array(recipientSlice)
  
  entity.message = event.params.message;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.sender = Address.fromBytes(event.transaction.from);
  entity.recipient = Address.fromBytes(recipient);
  entity.attestationHash = Bytes.fromByteArray(
    crypto.keccak256(event.params.message),
  );
  const burnEvent = Burn.load(event.transaction.hash)
  // this assumes that an entity was previously created since the Burn event is emitted before the MessageSent event
  // In case of `replaceDepositForBurn`, only MessageSent and DepositForBurn events are sent
  // https://arbiscan.io/tx/0x932339d47c002cf0bb3a5948a20612d01eca98a48213dfc342697196e6bc4a68#eventlog
  if (burnEvent) {
    entity.amount = burnEvent.amount;
  } else {
    log.warning("No Burn event created before MessageSent", []);
  }
  entity.sourceDomain = sourceDomain;
  entity.nonce = nonce;
   
  entity.save();
}


export function handleBurn(event: BurnEvent): void {
  let entity = new Burn(
    event.transaction.hash
  )
  entity.burner = event.params.burner
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
