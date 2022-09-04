import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { HttpAgent, Actor } from "@dfinity/agent"
import { idlFactory } from "../../../declarations/nft"
import { Principal } from "@dfinity/principal"
import Button from "./Button";
import { opend } from "../../../declarations/opend"
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item(props) {

    const [name, setName] = useState()
    const [owner, setOwner] = useState()
    const [image, setImage] = useState()
    const [button, setButton] = useState()
    const [priceInput, setPriceInput] = useState()
    const [loaderHidden, setLoaderHidden] = useState(true)
    const [blur, setBlur] = useState()
    const [sellStatus, setSellStatus] = useState("")
    const [priceLabel, setPriceLabel] = useState()

    const id = props.id
    const localHost = "http://localhost:8080/"
    const agent = new HttpAgent({
        host: localHost
    })
    agent.fetchRootKey()
    let nftActor 

    async function loadNFT() {
        nftActor = await Actor.createActor(idlFactory, {
            agent,
            canisterId: id,
        })

        const name = await nftActor.getName()
        const owner = await nftActor.getOwner()
        const imageData = await nftActor.getAsset()
        const imageContent = new Uint8Array(imageData)
        const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}))
        setName(name)
        setOwner(owner.toText())
        setImage(image)


        if(props.role == "collection") {
            const nftIsListed = await opend.isListed(props.id)

            if (nftIsListed) {
                setOwner("OpenD")
                setBlur({ filter: "blur(4px" })
                setSellStatus("Listed")
            } else {
                setButton(<Button handleClick={handleSell} text={"Sell"} />)
            }
        } else if(props.role == "discover") {
            const orginalOwner = await opend.getOriginalOwner(props.id)
            if(orginalOwner.toText() != CURRENT_USER_ID.toText()) {
                setButton(<Button handleClick={handleBuy} text={"Buy"} />)
            }

            const price = await opend.getListedNftPrice(props.id)
            setPriceLabel(<PriceLabel sellPrice={price.toString()} />)
        }        
    }

    async function handleBuy() {
        console.log("Buy was triggered!")
    }

    let price
    function handleSell() {
        setPriceInput(<input
            placeholder="Price in RON"
            type="number"
            className="price-input"
            value={ price }
            onChange={(event) => {
                price = event.target.value
            } }
        />)
        setButton(<Button handleClick={sellItem} text={"Confirm"}/>)
    }

    async function sellItem() {
        setBlur({filter: "Blur(4px)"})
        setLoaderHidden(false)
        console.log("Confirm Clicked!")
        console.log(price)
        const listingResult= await opend.listItem(props.id, Number(price))
        if (listingResult == "Success") {
            const opendId = await opend.getCanisterId()
            const transferResult = await nftActor.transferOwnership(opendId, true)
            if (transferResult == "Success") {
                setLoaderHidden(true)
                setButton()
                setPriceInput()
                setOwner("OpendD")
                setSellStatus("Listed")
            }
        }  
    }

    useEffect(() => {
        loadNFT()
    }, [])

    return (
        <div className="disGrid-item">
            <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
                <img
                    className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
                    src={image}
                    style={blur}
                />
                <div hidden={loaderHidden} className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div className="disCardContent-root">
                    {priceLabel}
                    <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
                        {name} <span className="purple-text">{sellStatus}</span>
                    </h2>
                    <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
                        Owner: {owner}
                    </p>
                    {priceInput}
                    {button}
                </div>
            </div>
        </div>
    );
}

export default Item;
