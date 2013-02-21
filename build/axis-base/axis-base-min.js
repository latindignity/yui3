YUI.add("axis-base",function(e,t){function d(){}var n=e.config,r=n.win,i=n.doc,s=e.Lang,o=s.isString,u=e.DOM,a,f,l,c,h=e.ClassNameManager.getClassName,p=h("seriesmarker");d.ATTRS={styles:{getter:function(){return this._styles=this._styles||this._getDefaultStyles(),this._styles},setter:function(e){this._styles=this._setStyles(e)}},graphic:{}},d.NAME="renderer",d.prototype={_styles:null,_setStyles:function(e){var t=this.get("styles");return this._mergeStyles(e,t)},_mergeStyles:function(t,n){n||(n={});var r=e.merge(n,{});return e.Object.each(t,function(e,t,i){n.hasOwnProperty(t)&&s.isObject(e)&&!s.isFunction(e)&&!s.isArray(e)?r[t]=this._mergeStyles(e,n[t]):r[t]=e},this),r},_getDefaultStyles:function(){return{padding:{top:0,right:0,bottom:0,left:0}}}},e.augment(d,e.Attribute),e.Renderer=d,e.AxisBase=e.Base.create("axisBase",e.Base,[e.Renderer],{initializer:function(){this.after("minimumChange",e.bind(this._keyChangeHandler,this)),this.after("maximumChange",e.bind(this._keyChangeHandler,this)),this.after("keysChange",this._keyChangeHandler),this.after("dataProviderChange",this._dataProviderChangeHandler)},_dataProviderChangeHandler:function(e){var t=this.get("keyCollection").concat(),n=this.get("keys"),r;if(n)for(r in n)n.hasOwnProperty(r)&&delete n[r];t&&t.length&&this.set("keys",t)},_updateMinAndMax:function(){},GUID:"yuibaseaxis",_type:null,_setMaximum:null,_setMinimum:null,_data:null,_updateTotalDataFlag:!0,_dataReady:!1,addKey:function(e){this.set("keys",e)},_getKeyArray:function(e,t){var n=0,r,i=[],s=t.length;for(;n<s;++n)r=t[n],i[n]=r[e];return i},_updateTotalData:function(){var e=this.get("keys"),t;this._data=[];for(t in e)e.hasOwnProperty(t)&&(this._data=this._data.concat(e[t]));this._updateTotalDataFlag=!1},removeKey:function(e){var t=this.get("keys");t.hasOwnProperty(e)&&(delete t[e],this._keyChangeHandler())},getKeyValueAt:function(e,t){var n=NaN,r=this.get("keys");return r[e]&&s.isNumber(parseFloat(r[e][t]))&&(n=r[e][t]),parseFloat(n)},getDataByKey:function(e){var t,n,r,i,o=this.get("keys");if(s.isArray(e)){t={},r=e.length;for(n=0;n<r;n+=1)i=e[n],o[i]&&(t[i]=this.getDataByKey(i))}else o[e]?t=o[e]:t=null;return t},getTotalMajorUnits:function(){var e,t=this.get("styles").majorUnit;return e=t.count,e},getEdgeOffset:function(e,t){var n;return this.get("calculateEdgeOffset")?n=t/e:n=0,n},_keyChangeHandler:function(e){this._updateMinAndMax(),this._updateTotalDataFlag=!0,this.fire("dataUpdate")},_getDefaultStyles:function(){var e={majorUnit:{determinant:"count",count:11,distance:75}};return e},_maximumGetter:function(){var e=this.get("dataMaximum"),t=this.get("minimum");return t===0&&e===0&&(e=10),s.isNumber(this._setMaximum)&&(e=this._setMaximum),parseFloat(e)},_maximumSetter:function(e){return this._setMaximum=parseFloat(e),e},_minimumGetter:function(){var e=this.get("dataMinimum");return s.isNumber(this._setMinimum)&&(e=this._setMinimum),parseFloat(e)},_minimumSetter:function(e){return this._setMinimum=parseFloat(e),e},_getSetMax:function(){return s.isNumber(this._setMaximum)},_getSetMin:function(){return s.isNumber(this._setMinimum)}},{ATTRS:{calculateEdgeOffset:{value:!1},labelFunction:{valueFn:function(){return this.formatLabel}},keys:{value:{},setter:function(e){var t={},n,r,i=this.get("dataProvider");if(s.isArray(e)){r=e.length;for(n=0;n<r;++n)t[e[n]]=this._getKeyArray(e[n],i)}else if(s.isString(e))t=this.get("keys"),t[e]=this._getKeyArray(e,i);else for(n in e)e.hasOwnProperty(n)&&(t[n]=this._getKeyArray(n,i));return this._updateTotalDataFlag=!0,t}},type:{readOnly:!0,getter:function(){return this._type}},dataProvider:{setter:function(e){return e}},dataMaximum:{getter:function(){return s.isNumber(this._dataMaximum)||this._updateMinAndMax(),this._dataMaximum}},maximum:{lazyAdd:!1,getter:"_maximumGetter",setter:"_maximumSetter"},dataMinimum:{getter:function(){return s.isNumber(this._dataMinimum)||this._updateMinAndMax(),this._dataMinimum}},minimum:{lazyAdd:!1,getter:"_minimumGetter",setter:"_minimumSetter"},setMax:{readOnly:!0,getter:"_getSetMax"},setMin:{readOnly:!0,getter:"_getSetMin"},data:{getter:function(){return(!this._data||this._updateTotalDataFlag)&&this._updateTotalData(),this._data}},keyCollection:{getter:function(){var e=this.get("keys"),t,n=[];for(t in e)e.hasOwnProperty(t)&&n.push(t);return n},readOnly:!0},labelFunctionScope:{}}})},"@VERSION@",{requires:["classnamemanager","datatype-number","datatype-date","base","event-custom"]});