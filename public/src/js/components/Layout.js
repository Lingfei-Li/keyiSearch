
import React from "react"
import * as axios from "axios"
import uuid from "uuid"


export default class Layout extends React.Component {
    
    constructor(){
        super();


        this.state = {
            "searchText":"移动终端",
            "dbLoadCompleted":false,
            "searchComplete":false
        };
        
        //Load patent application data from db
        axios.get("api/db/patentApplication?limit=1000").then((res)=>{
            this.setState({
                "data":res.data,
                "dbLoadCompleted":true
            });
        }).catch((res)=>{
            alert("Getting patent application error: " + res);
        });
    }
    updateSearchText(e) {
        this.setState({"searchText":e.target.value});
    }
    
    splitByCommas(str) {
        return str.split(/[,，]+/).filter((item)=>{
            return item.length > 0;
        }) .map((item)=>{return item.trim()});
    }
    
    toSegmentSet(arr) {
    }
    
    wrapKeywords(keywords) {
        return keywords.map((item)=>{
            return (
                <span key={uuid.v1()} className="keyword" onClick={this.addToSearchText.bind(this)}>
                    {item}
                </span>
            );
        });
    }

    
    addToSearchText(e) {
        if(this.state.searchComplete == true) {
            this.setState({
                "searchText":e.target.innerHTML,
                "searchComplete":false
            });
        }
        else {
            this.setState({
                "searchText":this.state.searchText+","+e.target.innerHTML
            });
        }
    }
    
    doSearch() {
        var rawKeywords = this.splitByCommas(this.state.searchText);
        //segments search keywords
        axios.post("api/segment/", {"data":rawKeywords}).then((res)=>{
            console.log(res.data);
            const searchKeywordsComponents = this.wrapKeywords(rawKeywords);
            const segmentedKeywords = [...(new Set([...res.data]))];
            var result = [];
            if(segmentedKeywords.length == 0) {     //no keyword is provided. show all records
                result = this.state.data;
            }
            else {      //searching. please see alg.html for algorithm description
                result = this.state.data.map((item)=>{
                    var itemSearchResult = {    //similar to 'item', but added searching data
                        "keep": false,
                        "searchResultKeywordRanges":{},
                        ...item
                    };
                    Object.keys(item).forEach((key)=>{
                        var val = itemSearchResult[key];
                        segmentedKeywords.forEach((keyword)=>{
                            if(typeof val == "string" && val.indexOf(keyword) != -1) {  //Match found. Record the matching range
                                itemSearchResult.keep = true;
                                if(itemSearchResult.searchResultKeywordRanges[key] === undefined) {
                                    itemSearchResult.searchResultKeywordRanges[key] = [];
                                }
                                itemSearchResult.searchResultKeywordRanges[key].push({
                                    "left":val.indexOf(keyword), 
                                    "right":val.indexOf(keyword)+keyword.length
                                });
                            }
                        });
                    });
                    return itemSearchResult;
                }).filter((item)=>{
                    return item.keep == true;
                });

                //Process overlapped matching ranges, e.g. 2-4 3-5
                //and add html tags to highlight the keywords
                result.forEach((item)=>{        //process for each database record 
                    Object.keys(item.searchResultKeywordRanges).forEach((key)=>{    //process overlaps for each field, e.g. PatentName, State
                        item.searchResultKeywordRanges[key].sort((a, b)=>{          //sort the ranges by left then right, ascending order
                            if(a.left == b.left)
                                return a.right - b.right;
                            return a.right - b.right;
                        });
                        var l = -1;     //the maximum range processed
                        var r = -1;
                        var rangesClean = [];
                        item.searchResultKeywordRanges[key].forEach(({left, right})=>{    //confusing naming here. might improve in the future
                            if(l == -1 && r == -1) {        //warm up
                                l = left;
                                r = right;
                            }
                            else if(left > r) {             //current range is entirely to the right of the maximum range
                                rangesClean.push({"left":l, "right":r});
                                l = left;
                                r = right;
                            }
                            else if(right <= l) {  //interval is contained by maximum range (because 'left' is mono-increasing)
                                //nothing
                            }
                            else {                      //interval is crossing the boundary
                                r = right;              //no need to update l, because 'left' is incr
                            }
                        });
                        rangesClean.push({"left":l, "right":r});    //wrap up the remaining range
                        
                        //Add html tags according to the processed ranges
                        var last = 0;                   //last pos being processed
                        var str = "";                   //final string with html tags
                        rangesClean.forEach(({left, right})=>{
                            if(left > last) 
                                str += item[key].substring(last, left);
                            str += "<span class='searchResultKeyword'>" + item[key].substring(left, right) + "</span>";
                            last = right;
                        });
                        str += item[key].substring(last);   //handle the remainings
                        item[key] = str;
                    });
                });
                
                
                //sort the result by relevance
            }

            var searchResult = result.map((item)=>{
                return (
                    <div key={uuid.v1()} className="well">
                        <div dangerouslySetInnerHTML={{__html: item.PatentName}}></div>
                        <div dangerouslySetInnerHTML={{__html: item.ApplicantName}}></div>
                        <div dangerouslySetInnerHTML={{__html: item.State}}></div>
                    </div>
                );
            });

            this.setState({
                "searchKeywords":searchKeywordsComponents,
                searchResult,
                "searchComplete":true
            });
           
            
            
        }).catch((res)=>{   //keyword segmenting fails
            console.log(res);
        });
        
        return false;
    }
    
    render(){
        
        const searchButton = (
            <button type="submit" className="btn btn-sm btn-primary" >搜索</button>
        );
        const searchButtonLoading = (
            <button type="submit" className="btn btn-sm disabled" >数据库载入中</button>
        );

        
        return(
            <div className="container">
                <h2>搜索科亿专利数据库</h2>
                <div className="form-group">
                    <form onSubmit={this.doSearch.bind(this)} action="#">
                        <input className="form-control" type="text" value={this.state.searchText} onChange={this.updateSearchText.bind(this)} placeholder="用逗号分隔"/>
                        {this.state.dbLoadCompleted==true?searchButton:searchButtonLoading}
                    </form>
                </div>
                <div className="container">
                    <div>
                        {this.state.searchKeywords}
                    </div>
                    <pre>
                        {this.state.searchResult}
                    </pre>
                </div>
            </div>
        );
    };
}