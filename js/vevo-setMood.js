// FUNCTION DECLARATIONS // 

function removePropertyKeys (currentProperty, totalKeys) {
    var i;
    totalKeys = totalKeys || currentProperty.numKeys;
    if(currentProperty.numKeys > 0){
        for (i = totalKeys ; i > 0 ; i--){
            currentProperty.removeKey(i);
        }
    }
};

function isEven(n) {
    return n % 2 == 0;
};

function resetCurrentMarker (currenMarkerIndex, currentMarkerName,lastMarkerTime){
    var currentMarkerTime = markerLayerProperty.keyTime(currenMarkerIndex);
    markerLayerProperty.removeKey(currenMarkerIndex);
    var newMarker = new MarkerValue (currentMarkerName);
    markerLayer.property("Marker").setValueAtTime(lastMarkerTime + comp.frameDuration, newMarker);
    return currentMarkerTime + comp.frameDuration + lastMarkerTime-currentMarkerTime;
};

function isBehindLastFrame(currentMarkerTime){
     return (currentMarkerTime <= lastKeyTime);
};

 function isUnused(currentMarkerTime){
    return (currentMarkerTime >= comp.markerProperty.keyTime(1));
};

function writeCurrentMarkerKeys(currenMarkerIndex,currentMarkerName,currentMarkerTime){
    var timeValue = (currenMarkerIndex - 1) * 4;
    var duration = getDuration(currenMarkerIndex);
    if(lastKeyTime !=undefined && currentMarkerName != "Intro"){
        if (isBehindLastFrame(currentMarkerTime) || currenMarkerIndex == 2){
            currentMarkerTime = resetCurrentMarker(currenMarkerIndex,currentMarkerName,lastKeyTime);
        }
    }
    timeRemapProperty.setValueAtTime(currentMarkerTime, timeValue);
    timeRemapProperty.setValueAtTime(currentMarkerTime + duration, timeValue + duration + comp.frameDuration);
    lastKeyTime = timeRemapProperty.keyTime(timeRemapProperty.numKeys-1);
    
};

function saveCurrentMarkers(){
    var i;
    var extraMarkerName, currentMarkerTime;
    for(i = 1 ; i <= markerLayerProperty.numKeys ; i++){
        var currentMarkerName = mainMarkerLabels[i-1];
        currentMarkerTime = markerLayerProperty.keyTime(i);
        currentMarkers.push([currentMarkerName,currentMarkerTime]);
    }

    if(isEven(currentMarkers.length)){
        extraMarkerName = mainMarkerLabels[currentMarkers.length];
        currentMarkers.push([extraMarkerName,currentMarkerTime + 5]);
    }
};

function writeNewMarkers(currentMarkers,targetLayer){
    var i;
    var layerMarkers = targetLayer.property('Marker');
    removePropertyKeys(layerMarkers);
    for(i = 0 ; i < currentMarkers.length ; i++){
        var markerName = currentMarkers[i][0]; 
        var markerTime = currentMarkers[i][1];
        var newMarker = new MarkerValue (markerName);
        layerMarkers.setValueAtTime(markerTime, newMarker);
        writeCurrentMarkerKeys(i+1,markerName,markerTime);
    }
    setHoldKey();
};

function setHoldKey(){
    var lastValue = timeRemapProperty.keyValue(timeRemapProperty.numKeys-1);
    if(markerLayerProperty.keyTime(1) > 0){
       timeRemapProperty.removeKey(1);
    }
    timeRemapProperty.setValueAtTime(scrollLayer.outPoint, lastValue);
}

function getDuration(i){
    var localDuration;
    if (i == 1){
        localDuration = 4;
    } else if (isEven(i)){
        localDuration = 2;
        } else {
            localDuration = 1;
        }

    return localDuration;
};

function shiftPropertyKeys(currentProperty){
   var propertyValuesAry = getPropertyKeys(currentProperty);
   writePropertyKeys(propertyValuesAry, currentProperty);
}
 
function getPropertyKeys(currentProperty){
    var i;
    var ary = [];
    var delta = 0;
    var currentKeyTime, prevKeyTime;
    for (i = 1 ; i <= currentProperty.numKeys; i++){
        var currentKeyValue = currentProperty.keyValue(i);
        currentKeyTime = currentProperty.keyTime(i);
        
        if(i != 1){
            prevKeyTime = currentProperty.keyTime(i-1);
            delta = currentKeyTime - prevKeyTime;
        }
        ary.push([currentKeyValue[0],currentKeyValue[1], delta]);
    }
    return ary;
}

function writePropertyKeys(valuesArray, currentProperty){
    var i;
    removePropertyKeys(currentProperty);
    var currentKeyTime, ary;
    var prevKeyTime = getMarkerTime(markerLayerProperty, 1);
    for ( i = 0; i < valuesArray.length; i++){
        ary = [valuesArray[i][0], valuesArray[i][1]];
        var currentDelta = valuesArray[i][2];
        currentKeyTime = prevKeyTime + currentDelta;
        currentProperty.setValueAtTime(currentKeyTime, ary);
        prevKeyTime = currentKeyTime;
    }
}

function getMarkerTime(targetLayerProperty, index){
    return targetLayerProperty.keyTime(index);
}

function searchProjectForLayerName(targeLayerName){
    var targetLayer;
    var targetLayerArray = [];
    var i;
    var j;
    for(i = 1; i <= totalItems; i++ ){
        var currentItem = projectItems[i];
        if(currentItem instanceof CompItem){
            var allLayers = currentItem.layers;
            var totalLayers = allLayers.length;
            if(totalLayers > 0){
                for(j = 1; j <= totalLayers ; j++){
                    var currentLayer = allLayers[j];
                    if(currentLayer.name.search(targeLayerName) > -1){
                       targetLayerArray.push([currentItem, currentLayer])
                    }
                }
            }
        }
    }
    return targetLayerArray;
}

function searchProjectForFootageItem(targetFootageName){
    var eval = false;
    var i;
    for(i = 1; i <= totalItems; i++){
        var currentItem = projectItems[i];
        var currentName = currentItem.name;
        if(currentName == targetFootageName && isFootageItem(currentItem)){
            eval = true;
        }
    }
    return eval;
}

function isFootageItem(targetItem){
    return targetItem instanceof FootageItem;
}

function setVevoOut(ary){
    var vevoOut = getMainVideoOutTime() - 5 * comp.frameDuration;
    var i, currentComp, currentLayer;
    for (i = 0; i < ary.length; i++){
        currentComp = ary[i][0];
        currentLayer = ary[i][1];
        currentLayer.startTime = vevoOut;
        currentComp.workAreaDuration = currentLayer.outPoint;
    }
}

function getMainVideoOutTime(){
    var i;
    var outTime;
    var editComp = getCompByName(mainEditCompName);
    if (editComp != null){
        var totalLayers = editComp.numLayers;
        var allLayers = editComp.layers;
        if(totalLayers > 0){
            for(i = 1; i <= totalLayers; i++){
                var currentLayerName = allLayers[i].name;
                var currentLayerObject = allLayers[i];
                if(searchProjectForFootageItem(currentLayerName)){
                    outTime = currentLayerObject.outPoint;
                    break;
                }
               
            }
        }
    }
   return outTime;
}

function getCompByName(itemName){
    var targetComp;
    var i;
    for(i = 1; i <= totalItems; i++ ){
        var currentItem = projectItems[i];
        if(currentItem.name == itemName){
            targetComp = currentItem;
        }
    }
    return targetComp;
}

//-----------------------//

var comp = app.project.activeItem;
var projectItems = app.project.items;
var totalItems = app.project.numItems;
var scrollLayer = comp.layer("02_SCROLLING BOXES");
var markerLayer = comp.layer("Set Markers");
var mainEditCompName = "01_VIDEO EDIT";
var matteLayerName = "tbc_In Matte";
var vevoLogoName = "vevo logo out";
var mainMarkerLabels = ["Intro", "Mood 1", "Track 1", "Mood 2", "Track 2", "Mood 3", "Track 3", "Mood 4", "Track 4", "Mood 5", "Track 5"];
var currentMarkers = [];
var timeRemapProperty, matteSizeProperty, positionProperty;

app.beginUndoGroup("Set The Mood");
if(comp.name.search('SET THE MOOD') > -1 && comp instanceof CompItem){
    comp.openInViewer();
    if(scrollLayer != undefined && markerLayer != undefined){
        //----Program Start----Staging---//
        var markerLayerProperty = markerLayer.property('Marker');
        var lastKeyTime;
        timeRemapProperty = scrollLayer.property("ADBE Time Remapping");

        var matteLayers = searchProjectForLayerName(matteLayerName);
        var vevoLogoLayers = searchProjectForLayerName(vevoLogoName);

        setVevoOut(vevoLogoLayers);

        matteSizeProperty = matteLayers[0][1].property("Contents").property("Rectangle 1").property("Contents").property("Rectangle Path 1").property("Size");
        positionProperty = matteLayers[0][1].property("ADBE Transform Group").property("ADBE Position");
          
        removePropertyKeys(timeRemapProperty);
        scrollLayer.timeRemapEnabled = true;
        
        saveCurrentMarkers();
        writeNewMarkers(currentMarkers,markerLayer);
        shiftPropertyKeys(matteSizeProperty);
        shiftPropertyKeys(positionProperty);


        alert('Success!');
    } else { alert(comp.name + " is missing Marker Layer or Scrolling Layer."); }
} else { alert('Please Open SET THE MOOD BOXES composition');}
app.endUndoGroup();