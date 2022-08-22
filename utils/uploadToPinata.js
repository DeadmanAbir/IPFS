require("dotenv").config()

const pinataSdk = require("@pinata/sdk")

const path = require("path")

const fs = require("fs")

const pinata = pinataSdk(process.env.PINATA_API, process.env.PINATA_API_SECRET)

async function storeImages(imgPath) {
    const fullImages = path.resolve(imgPath)
    const files = fs.readdirSync(fullImages)
    let responses = []
    console.log("Processing Pinata")

    for (let i = 0; i < files.length; i++) {
        console.log(`Working on ${files[i]}`)
        const readableFile = fs.createReadStream(`${fullImages}/${files[i]}`)
        try {
            const tx = await pinata.pinFileToIPFS(readableFile)
            responses.push(tx)
        } catch (e) {
            console.log(e)
        }
    }
    return { responses, files }
}

async function storeUri(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (e) {
        console.log(e)
    }
    return null
}

module.exports = { storeImages, storeUri }
