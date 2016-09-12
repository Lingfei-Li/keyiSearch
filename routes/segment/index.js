
var express = require('express');
var router = express.Router();
var Segment = require('segment');
require('dotenv').config();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.send("POST request to / gives you data");
});

/**
 * Segments and returns Chinese sentences
 * input: json object with "data" field as an array holding the sentence to be segmented
 * output: js array holding the segments
 * */
router.post('/', function(req, res, next) {
    if(req.body.data === undefined) {
        res.status(400).send('"data" field missing in the request');
    }
    else {
        const data = req.body.data;
        var segment = new Segment();
        segment.useDefault();
        segment.loadStopwordDict('stopword.txt');
        
        var segments = new Set();
        data.forEach((sentence)=>{
            segment.doSegment(sentence, {
                simple:true,
                stripPunctuation: true,
                stripStopword:true,
                convertSynonym: true
            }).forEach((seg)=>{
                segments.add(seg);
            });
        });
        res.json(Array.from(segments));
    }
});

module.exports = router;
