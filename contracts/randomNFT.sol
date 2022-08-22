// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract randomNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable{

    VRFCoordinatorV2Interface private immutable i_coordinator;

    uint32 private immutable i_callbackGasLimit;
    uint16 private constant c_requestConfirmations=3;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private constant c_numWords=1;
    uint256 private tokenCounter;
    uint256 private constant c_maxChance=100;
    string[3] private dogUri;
    uint256 private immutable fee;

    mapping(uint256=>address) public helper;

    event nftRequested(uint256 id, address sender);
    event minted(breed dogBreed, address minter);

    enum breed{
        pug, 
        shiba,
        bernard
    }


    constructor(address chainlinkAddress, uint32 callbackGasLimit, uint64 subscriptionId, bytes32 gasLane, string[3] memory uri, uint256 mintFee) 
    VRFConsumerBaseV2(chainlinkAddress)
    ERC721("IPFS", "RI")
    {
        i_coordinator= VRFCoordinatorV2Interface(chainlinkAddress);
        i_callbackGasLimit=callbackGasLimit;
        i_subscriptionId=subscriptionId;
        i_gasLane=gasLane;
        dogUri=uri;
        fee=mintFee;


    }

    function requestNft()public payable returns(uint256 requestId){
        require(msg.value>=fee, "send more ETH for minting");
        requestId=i_coordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            c_requestConfirmations,
            i_callbackGasLimit,
            c_numWords
        );
        helper[requestId]=msg.sender;

        emit nftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override{
        address owner=helper[requestId];
        uint256 newId= tokenCounter;
      
        uint256 moddedRng= randomWords[0] % c_maxChance;

        breed dogBreed= getBreed(moddedRng);
        _safeMint(owner, newId);
        _setTokenURI(newId, dogUri[uint256(dogBreed)]);

        emit minted(dogBreed, owner);


    }

    function getBreed(uint256 _breed)public pure returns(breed){
        uint256 sum=0;

        uint256[3] memory chanceArray=getChanceArray();

        for(uint256 i=0; i<chanceArray.length; i++){
            if(_breed>=sum && _breed< sum+ chanceArray[i]){
                return breed(i);
            }
            sum=sum+chanceArray[i];
        }

        revert("Reverting.............");


    }

    function withdraw()public onlyOwner{
        (bool success, )=payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Transfer Failed!");
    }

    function getChanceArray()public pure returns(uint256[3]memory){
        return [10, 30, c_maxChance];
    }

    function getMintFee()public view returns(uint256){
        return fee;
    }

    function getTokenUri(uint256 index)public view returns(string memory){
        return dogUri[index];
    }

    function getTokenCounter()public view returns(uint256){
        return tokenCounter;
    }
}
