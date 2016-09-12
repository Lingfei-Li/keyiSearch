
var express = require('express');
var router = express.Router();
var sql = require('mssql');
var config = require('config');
var Segment = require('segment');
require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.send("get request to /patentApplication gives you data");
});

router.get('/patentApplication', function(req, res, next) {
    
    const DB_NAME = config.get('db.dbname');
    const DB_ADDR = config.get('db.addr');
    const DB_USER= config.get('db.user');
    const DB_PWD = config.get('db.pwd');

    const limit = (req.query.limit===undefined) ? "" : `top ${Math.max(0, parseInt(req.query.limit))}`;
    const columns = `*`;
    const conn_str = `mssql://${DB_USER}:${DB_PWD}@${DB_ADDR}/${DB_NAME}`;
    const query_str = `select ${limit} ${columns} from PatentApplication`;
    
    sql.connect(conn_str).then(function() {
        new sql.Request().query(query_str).then(function (recordset) {
            var segment = new Segment();
            segment.useDefault();
            segment.loadStopwordDict('stopword.txt');
            recordset.map((data)=>{
                var segments = segment.doSegment(data.PatentName, {
                    simple:true,
                    stripPunctuation: true,
                    stripStopword:true,
                    convertSynonym: true
                });
                console.log(data.PatentName);
                console.log(segments);
                data.Segments = segments;
                return data;
            });
            res.json(recordset);
        }).catch(function (err) {
            res.send("Error: ", err);
        });
    });
});

module.exports = router;
