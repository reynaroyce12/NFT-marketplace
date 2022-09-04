import type { Principal } from '@dfinity/principal';
export interface nft {
  'getAsset' : () => Promise<Array<number>>,
  'getCanisterId' : () => Promise<Principal>,
  'getName' : () => Promise<string>,
  'getOwner' : () => Promise<Principal>,
  'transferOwnership' : (arg_0: Principal, arg_1: boolean) => Promise<string>,
}
export interface _SERVICE extends nft {}
