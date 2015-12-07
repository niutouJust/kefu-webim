;(function () {
    var EMPTYFN = function () {};

    var _createStandardXHR = function () {
        try {
            return new window.XMLHttpRequest();
        } catch( e ) {
            return false;
        }
    };
    
    var _createActiveXHR = function () {
        try {
            return new window.ActiveXObject( "Microsoft.XMLHTTP" );
        } catch( e ) {
            return false;
        }
    };

    var emajax = function ( options ) {
        var dataType = options.dataType || 'text';
        var suc = options.success || EMPTYFN;
        var error = options.error || EMPTYFN;
        var xhr = _createStandardXHR () || _createActiveXHR();
        xhr.onreadystatechange = function () {
            if( xhr.readyState === 4 ){
                var status = xhr.status || 0;
                if ( status === 200 ) {
                    if ( dataType === 'text' ) {
                        suc(xhr.responseText, xhr);
                        return;
                    }
                    if ( dataType === 'json' ) {
                        try {
                            var json = JSON.parse(xhr.responseText);
                            suc(json,xhr);
                        } catch ( e ) {}
                        return;
                    }
                    suc(xhr.response || xhr.responseText,xhr);
                    return;
                } else {
                    if ( dataType=='json'){
                        try{
                            var json = Utils.parseJSON(xhr.responseText);
                            error(json, xhr, '服务器返回错误信息');
                        } catch ( e ) {
                            error(xhr.responseText,xhr, '服务器返回错误信息');
                        }
                        return;
                    }
                    error(xhr.responseText, xhr, '服务器返回错误信息');
                    return;
                }
            }
            if( xhr.readyState === 0 ) {
                error(xhr.responseText, xhr, '服务器异常');
            }
        };

        var type = options.type || 'GET',
            data = options.data || {},
            tempData = '';

        if ( type === 'GET' ) {
            for ( var o in data ) {
                if ( data.hasOwnProperty(o) ) {
                    tempData += o + '=' + data[o] + '&';
                }
            }
            tempData = tempData ? tempData.slice(0, -1) : tempData;
            options.url += (options.url.indexOf('?') > 0 ? '&' : '?') + (tempData ? tempData + '&' : tempData) + '_v=' + new Date().getTime();
            data = null;
        } else {
            data._v = new Date().getTime();
            data = JSON.stringify(data);
        }
        xhr.open(type, options.url);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data);
        return xhr;
    };
    window.easemobIM = window.easemobIM || {};
    window.easemobIM.emajax = emajax;
}());

/**
  * message transfer
 */
window.easemobIM = window.easemobIM || function () {};
easemobIM.Transfer = (function () {
    
    var handleMsg = function ( e ) {
        if ( JSON && JSON.parse ) {
            var msg = e.data;
            msg = JSON.parse(msg);
            this.targetOrigin = msg.data.origin;
            typeof callback === 'function' && callback(msg);
        }
    };

    var Message = function ( iframeId ) {
        if ( !(this instanceof Message) ) {
             return new Message();
        }
        this.iframe = document.getElementById(iframeId);
        this.origin = location.protocol + '//' + document.domain + location.port;
    };

    Message.prototype.send = function ( msg ) {

        msg.origin = this.origin;
        msg = JSON.stringify(msg);

        if ( this.iframe ) {
            this.iframe.contentWindow.postMessage(msg, '*');
        } else {
            window.parent.postMessage(msg, this.targetOrigin);
        }
        return this;
    };

    Message.prototype.listen = function ( callback ) {
        if ( window.addEventListener ) {
            window.addEventListener('message', handleMsg, false);
        } else if ( window.attachEvent ) {
            window.attachEvent('message', handleMsg);
        }
        return this;
    };

    return Message;
}());

;(function () {
    var getData = new easemobIM.Transfer();

    var createObject = function ( url, msg, type ) {
        return {
            url: url
            , data: msg.data
            , type: type || 'GET'
            , success: function ( info ) {
                try {
                    info = JSON.parse(info);
                } catch ( e ) {}
                getData.send({
                    call: msg.api
                    , timespan: msg.timespan
                    , status: 0
                    , data: info
                });
            }
            , error: function ( info ) {
                try {
                    info = JSON.parse(info);
                } catch ( e ) {}
                getData.send({
                    call: msg.api
                    , status: 1
                    , data: info
                });
            }
        };
    };

    getData.listen(function ( msg ) {
        getData.targetOrigin = msg.origin;

        switch ( msg.api ) {
            case 'getRelevanceList':
                easemobIM.emajax(createObject('/v1/webimplugin/targetChannels', msg));
                break;
            case 'getDutyStatus':
                easemobIM.emajax(createObject('/v1/webimplugin/timeOffDuty', msg));
                break;
            case 'createVisitor':
                easemobIM.emajax(createObject('/v1/webimplugin/visitors', msg, 'POST'));
                break;
            case 'getSession':
                easemobIM.emajax(createObject('/v1/webimplugin/visitors/' + msg.data.id + '/CurrentServiceSession?techChannelInfo=' + msg.data.orgName + '%23' + msg.data.appName + '%23' + msg.data.imServiceNumber + '&tenantId=' + msg.data.tenantId, msg));
                break;
            case 'getPassword':
                easemobIM.emajax(createObject('/v1/webimplugin/visitors/password', msg));
                break;
            case 'getGroup':
                easemobIM.emajax(createObject('/v1/webimplugin/visitors/' + msg.data.id + '/ChatGroupId?techChannelInfo=' + msg.data.orgName + '%23' + msg.data.appName + '%23' + msg.data.imServiceNumber + '&tenantId=' + msg.data.tenantId, msg));
                break;
            case 'getHistory':
                easemobIM.emajax(createObject('/v1/webimplugin/visitors/msgHistory', msg));
                break;
            default:
                break;
        }
    });
}());
