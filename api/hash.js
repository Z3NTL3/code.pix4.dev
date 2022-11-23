const crypto = require('crypto');
const fs = require('node:fs')
const path = require('node:path')

var ascii = () =>{
    return new Promise((resolve) => {
        const caps = Array.from({length: 26}, (_, i) =>  String.fromCharCode(i + 65))
        const special_chars = Array.from({length: 120}, (_, i) =>  String.fromCharCode(i + 32))

        const ascii = caps.concat(special_chars)
        resolve({ascii : ascii, range: ascii.length})
    })
}
var generate = () => {
    return new Promise( async (resolve) => {
        let range = await ascii()
        
        let exists = true
        let filename = ''

        while(exists){
            try{
                let hash = crypto.createHash('md5')
                let random = range.ascii[Math.floor(Math.random() * range.ascii.length)]
                let dummy = String(random)
                
                filename += dummy
                hash.update(filename)

                let content = hash.digest('hex')

                if(fs.existsSync(path.join(__dirname,'../','sandbox',content +'.txt'))){

                } else {
                    filename = content + '.txt'
                    exists = false
                }
            } catch(err){
                continue
            }
        }
        resolve(filename)
    })
}


module.exports = {
    generate: generate
}
