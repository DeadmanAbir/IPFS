const{network, ethers}=require("hardhat");
const{developmentChains, networkConfig}=require("../helper-hardhat-config");
const{verify}=require("../utils/verify");
const {storeImages, storeUri}=require("../utils/uploadToPinata");

const imglocation="./images";

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const metadataTemplate={
    name: "",
    description: "",
    image: "",
    attributes: {
        trait_type: "Cuteness",
        value: 100
    }
}

module.exports=async({getNamedAccounts, deployments})=>{
    const{deploy, log}=deployments;
    const{deployer}=await getNamedAccounts();

    const chainIds=network.config.chainId;

    let chainlinkAddress, subIds, tokenUris;

    if(process.env.Upload=="true"){
        tokenUris=await handleTokenUris();
    }

    if(developmentChains.includes(network.name)){

        const contracts=await ethers.getContractFactory("VRFCoordinatorV2Mock");

        // const mock= await ethers.getContract("VRFCoordinatorV2Mock");

        const mock= await contracts.deploy(BASE_FEE, GAS_PRICE_LINK);

        chainlinkAddress= await mock.address;
        const tx=await mock.createSubscription();
        const receipt=await tx.wait(1);
        subIds=receipt.events[0].args.subId;
    }else{
        chainlinkAddress=await networkConfig[chainIds].vrfCoordinatorV2;

        subIds= networkConfig[chainIds]. subscriptionId;
    }

    log("________________________________");

    // await storeImages(imglocation);

    // args=[chainlinkAddress,
    //     subIds,
    //     networkConfig[chainIds].gasLane,
    //     networkConfig[chainIds].mintFee,
    //     networkConfig[chainIds].callbackGasLimit
    // ]

    async function handleTokenUris(){
        tokenUris=[];

        const{responses: imgResponses, files}=await storeImages(imglocation);
        for(i in imgResponses){
            let tokenMetadata={...metadataTemplate};
            tokenMetadata.name=files[i].replace(".png", "");
            tokenMetadata.description=`An cute ${tokenMetadata.name} pup`;
            tokenMetadata.image=`ipfs://${imgResponses[i].IpfsHash}`;

            console.log(`Uploading to IPFS ${tokenMetadata.name}`);

            const uploadResponse=await storeUri(tokenMetadata);
            tokenUris.push(`ipfs://${uploadResponse.IpfsHash}`);
        }
        console.log(`Token uris uploaded they are:`);
        console.log(tokenUris);
        return tokenUris;
    }

    
}

module.exports.tags=["all", "random"];