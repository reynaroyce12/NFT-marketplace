import Debug "mo:base/Debug";
import nftActorClass "../NFT/nft";
import Principal "mo:base/Principal";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor opend {

  private type Listing ={
    itemOwner: Principal;
    itemPrice: Nat;
  };

  var mapOfNfts = HashMap.HashMap<Principal, nftActorClass.nft>(1, Principal.equal, Principal.hash);
  var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
  var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);
  
  public shared(msg) func mint(imgData: [Nat8], name: Text) : async Principal {
    let owner : Principal = msg.caller;

    Debug.print(debug_show(Cycles.balance()));
    Cycles.add(100_500_000_000);
    let newNft = await nftActorClass.nft(name, owner, imgData);
    Debug.print(debug_show(Cycles.balance()));

    let newNftPrincipal = await newNft.getCanisterId();
    mapOfNfts.put(newNftPrincipal, newNft);
    addToOwnershipMap(owner, newNftPrincipal);
    return newNftPrincipal;
  };

  private func addToOwnershipMap(owner: Principal, nftId: Principal) {
      var ownerNfts : List.List<Principal> = switch(mapOfOwners.get(owner)) {
        case null List.nil<Principal>();
        case (?result) result;
      };

      ownerNfts := List.push(nftId, ownerNfts);
      mapOfOwners.put(owner, ownerNfts);
  };

  public query func getOwnedNFTs(user: Principal): async [Principal] {
      var userNFTs: List.List<Principal> = switch (mapOfOwners.get(user)) {
        case null List.nil<Principal>();
        case (?result) result;
      };
      return List.toArray(userNFTs);
  };

  public query func getListedNfts(): async [Principal] {
    let ids = Iter.toArray(mapOfListings.keys());
    return ids;
  };

  public shared(msg) func listItem(id: Principal, price: Nat):async Text {
    var item: nftActorClass.nft = switch (mapOfNfts.get(id)) {
      case null return "NFT does not exist";
      case (?result) result;
    };

    let owner = await item.getOwner();
    if (Principal.equal(owner, msg.caller)) {
      let newListing : Listing = {
        itemOwner = owner;
        itemPrice = price;
      };
      mapOfListings.put(id, newListing);
      return "Success";
    } else {
      return "You dont have any NFTs";
    };
  };

  public query func getCanisterId() : async Principal {
    return Principal.fromActor(opend);
  };

  public query func isListed(id: Principal): async Bool {
    if (mapOfListings.get(id) == null) {
      return false;
    } else {
      return true;
    };
  };

  public query func getOriginalOwner(id: Principal): async Principal {
    var listing: Listing = switch(mapOfListings.get(id)) {
      case null return Principal.fromText("");
      case (?result) result;
    };
    return listing.itemOwner;
  };

  public query func getListedNftPrice(id: Principal): async Nat {
    var listing: Listing = switch (mapOfListings.get(id)){
      case null return 0;
      case (?result) result;
    };

    return listing.itemPrice;
  };

}