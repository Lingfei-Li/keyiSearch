
import React from "react"
import * as axios from "axios"
import uuid from "uuid"


export default class Layout extends React.Component {
    
    constructor(){
        super();


        this.state = {
            "searchText":"移动终端互动电视同步控制装置",
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
        const searchKeywords = this.splitByCommas(this.state.searchText);
        const searchKeywordsComponents = this.wrapKeywords(searchKeywords);
        
        var result = [];
        if(searchKeywords.length == 0) {
            result = this.state.data;
        }
        else {
            //returns the patent application that includes any of the keywords in any of its fields
            result = this.state.data.filter((item)=>{
                var flag = false;
                Object.keys(item).forEach((key)=>{
                    const val = item[key];
                    searchKeywords.forEach((keyword)=>{
                        if(typeof val == "string" && val.indexOf(keyword) != -1) {
                            flag = true;
                        }
                    });
                });
                return flag;
            });
        }
        
        this.setState({
            "searchKeywords":searchKeywordsComponents,
            "searchResult":JSON.stringify(result, null, 2),
            "searchComplete":true
        });
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
                    <form onSubmit={this.doSearch.bind(this)}>
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