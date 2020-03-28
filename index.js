let express = require('express');
let path = require('path');
let mysql = require('mysql');
let hbs = require('hbs');
let bodyParser = require('body-parser');
let session = require('express-session');
let app = express();

let http = require('http').createServer(app);
let io = require('socket.io')(http);



app.use(function(request,result,next){
    result.setHeader("Access-Control-Allow-Origin","*");
    next();
});

app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized: false
}));
//middlware
app.use(function (req, res, next) {
    res.locals.currentUser = req.session.username;
    next();
});

// conect database
const conn = mysql.createConnection({
    host: 'ec2-54-197-48-79.compute-1.amazonaws.com',
    user: 'hqrrbmkgjmolti',
    password: 'd6d2a3b2d843be907585b59135a04702b26bc8edac787563e04746052cef4bc1',
    database: 'dav9s9taq7a4jp',
    port: '5432'
});

conn.connect((err)=>{
    if(err) throw err;
    console.log('database terhubung...');
});

app.set('views',path.join(__dirname,'views'));
app.set('view engine','hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use('/assets',express.static(__dirname +'/public'));

app.get('/',function(req,res){
        res.render('index');
});

//login auth
var sess;
app.post('/auth',function(req,res){
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    if(username && password){
        conn.query("SELECT * FROM users WHERE username = ? AND password = ?",[username,password],function(error,result,fileds){
            if(result.length > 0){
                req.session.login= true;
                req.session.username= username;
                // console.log( req.session.username);
                sess=req.session.username;
                res.redirect('/room');
            }else{
                res.redirect('/');
            }
            res.end();
        });
    }else{
        res.redirect('/');

    }
});
//halaman chat
app.get('/room',function(req,res){
    if(req.session.login){
        // conn.query("SELECT * FROM messages", function(error,messages){ 
            res.render('room');
    }else{
        res.redirect('/');
    }
    
});

//ambil pesan
app.get('/pesan',function(req,res){
    conn.query("SELECT users.username,messages.message FROM messages join users WHERE messages.username_pengirim = users.username  ORDER BY messages.id ASC",
    function(error,pesan){
        res.end(JSON.stringify(pesan));
    });
});

 //input pesan

io.on('connection',function(socket){
    console.log('penggunaterhubung',socket.id);
    //menangkap pesan dari clent
    socket.on('pesan',function(pesan){
        console.log('client berkata',pesan);
        conn.query("INSERT INTO messages VALUES('"+null+"','"+sess+"','"+pesan+"')",function(err,hasil){
            console.log('session: '+sess);
            io.emit('pesan',pesan,sess);//mengirim balik ke client
        });
    });
});

const port=process.env.PORT||3000;
http.listen(port,function(){//inget ini
    console.log('Server terhubung di port 3000');
});