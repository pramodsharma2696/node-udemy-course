
//Blocking - Synchronous 
const fs = require('fs');
const http = require('http');

// const text = fs.readFileSync('../note.txt', 'utf-8');


const syncData = fs.readFileSync('../data.json', 'utf-8');
const response = JSON.parse(syncData);
//Non-Blocking Asynchronous
const server = http.createServer((req, res) =>{
    const route = req.url;
    if(route === '/'){
        res.end(JSON.stringify({"message":"API is Loaded !"}));
    }else if(route === '/data'){
        res.end(JSON.stringify(response));
    }else{
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Internal Server Error');
    }
})
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
// fs.readFile('../data.json','utf-8', (err, data) => {
//     const response = JSON.parse(data);
//     console.log(response);
    
// })
// console.log('Reading files...');
