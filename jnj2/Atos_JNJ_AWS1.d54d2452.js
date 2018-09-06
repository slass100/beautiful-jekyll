parcelRequire=function(e,r,n,t){var i="function"==typeof parcelRequire&&parcelRequire,o="function"==typeof require&&require;function u(n,t){if(!r[n]){if(!e[n]){var f="function"==typeof parcelRequire&&parcelRequire;if(!t&&f)return f(n,!0);if(i)return i(n,!0);if(o&&"string"==typeof n)return o(n);var c=new Error("Cannot find module '"+n+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[n][1][r]||r};var l=r[n]=new u.Module(n);e[n][0].call(l.exports,p,l,l.exports,this)}return r[n].exports;function p(e){return u(p.resolve(e))}}u.isParcelRequire=!0,u.Module=function(e){this.id=e,this.bundle=u,this.exports={}},u.modules=e,u.cache=r,u.parent=i,u.register=function(r,n){e[r]=[function(e,r){r.exports=n},{}]};for(var f=0;f<n.length;f++)u(n[f]);if(n.length){var c=u(n[n.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=c:"function"==typeof define&&define.amd?define(function(){return c}):t&&(this[t]=c)}return u}({"eHzx":[function(require,module,exports) {

},{}],"Focm":[function(require,module,exports) 
{
"use strict";
require("./index.scss");
var n={template:'\n        <nav class="app-header">\n            <img class="logo" :src=logoSrc>\n\n            <span class="login" @click=logIn><a href="https://sso.connect.pingidentity.com/sso/sp/initsso?saasid=89d090b1-b370-4250-b7ff-43fcacce69d3&idpid=747c253b-aee2-4711-a9b0-f60a58ea748e">Log In</a></span>\n        </nav>\n    ',data:function(){return{logoSrc:"atos.png"}},methods:{logIn:function(){console.log("Log in")}}},
e={template:"\n        <h1 class='title title-decoration'>{{appTitle.mainTitle}} - {{appTitle.subTitle}}</h1>\n    ",props:["appTitle"]},
a={template:"\n        <div class=\"history-wrap\">\n            <h2 class=\"title\">Call History</h2>\n            <div class='table-wrap'>\n                <table>\n                    <tr class=\"table-header\">\n                        <th v-for='i in headNames'>{{i}}</th>\n                    </tr>\n                    <tr v-for='(i, index) in historyData'>\n                        <td v-for='j in headNames' v-if=\"j!=='snow'\">{{i[j]}}</td>\n                        <td v-for='j in headNames' v-if=\"j==='snow'\"><a :href='i[j]'>View</a></td>\n                    </tr>\n                </table>\n            </div>\n        </div>\n    ",data:function(){return{headNames:[]}},props:["historyData"],beforeMount:function(){for(var n in this.$props.historyData[0])this.headNames.push(n)}},
t={template:'\n        <section class="phone-interface">\n            <nav class="app-header">\n                <div class="header-left-wrap">\n                    <img class="logo" :src=logoSrc>\n                    <span class="change-status">change status <i class="fa fa-angle-down"></i></span>\n                </div>\n\n                <i class=\'fa fa-cog\'></i>\n            </nav>\n            <section class="in-app-title-section">\n                <h2>{{status}}</h2>\n            </section>\n            <section class="action-panel">\n                <div class="call-wrap">\n                    <button @click=dialNum class="btn btn-normal">\n                        <i></i><span>Dial Number</span>\n                    </button>\n                    <button @click=quickConne class="btn btn-normal">\n                        <i class="fa fa-address-book"></i><span>Quick connects</span>\n                    </button>\n                </div>\n                <button @click=setAvailable class="btn btn-primary">Set to Available</button>\n            </section>\n        </section>\n    ',data:function(){return{status:"Offline",logoSrc:"xxxxx"}},methods:{dialNum:function(){console.log("dial")},quickConne:function(){console.log("qucik")},setAvailable:function(){console.log("setavai")}}},
s={template:'\n        <section class="current-call-wrap">\n            <h2 class=\'greeting\'>Hello, {{userInfo.name}}!</h2>\n            <div class="current-call">\n                <p class="prop-display each-info" v-for="(i, key) in currentCall"  v-if="computeName(key) !== false">\n                    <span v-text=\'computeName(key)\' class="prop-name"></span>:<span class="prop-value">{{i}}</span>\n                </p>\n                <a v-for="(i, key) in currentCall" :href=i v-if="key===\'snow\'">SNOW incident URL</a>\n            </div>\n        </section>\n    ',props:["userInfo","currentCall"],methods:{computeName:function(n){var e="";switch(n){case"wwid":e="Caller WWID";break;case"number":e="Caller Phone";break;case"queue":e="Queue";break;case"topic":e="Topic";break;default:e=!1}return e}}};

window.VUE = window.VUE || new Vue({
	el:"#app",
	data:{
		appTitle:{
			mainTitle:"AWS Connect",
			subTitle:"J&J GSD Agent Desktop"
			},
		callHistory:[
			{
				time:"09:58:57 AM",
				wwid:"3456123",
				number:"+1 214 4032 2355",
				queue:"English",
				topic:"hardware problem",
				snow:"url..."
			},
			{
				time:"09:58:57 AM",
				wwid:"3456123",
				number:"+1 214 4032 2355",
				queue:"English",
				topic:"hardware problem",
				snow:"url..."
			},
			{
				time:"09:58:57 AM",
				wwid:"3456123",
				number:"+1 214 4032 2355",
				queue:"English",
				topic:"hardware problem",
				snow:"url..."
			}
			],
		userInfo:{	name:""	},
		currentCall:{
			time:"",
			wwid:"",
			number:"",
			queue:"",
			topic:"",
			snow:""
		}
		},
	components:{
		"app-header":n,
		"app-title":e,
		"phone-interface":t,
		"current-call":s,
		"call-history":a
		}
});
},{"./index.scss":"eHzx"}]},{},["Focm"], null)
//# sourceMappingURL=Atos_JNJ_AWS1.d54d2452.map

























