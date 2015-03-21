'use strict';

/*
    webgl Setup
*/

var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext('webgl', {
            antialias: true,
            preserveDrawingBuffer: true
        });
    } catch (e) {
    }
    if (!gl) {
        alert('Could not initialise WebGL, sorry :-(');
    }

}

function getShader(url, type, callback) {
    var shader;
    if (type === 'fragment') {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type === 'vertex') {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        callback(null);
    }

    var req = new XMLHttpRequest();

    req.open('GET', url);

    req.onreadystatechange = function (a, b, c) {
        if (req.readyState === 4) {
            if (req.status === 200) {
                gl.shaderSource(shader, req.responseText);
                gl.compileShader(shader);

                if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert(gl.getShaderInfoLog(shader));
                    callback(null);
                } else {
                    callback(shader);
                }
            } else {
                callback(null);
            }
        }
    };

    req.send();
}

var shaderProgram;

function initShaders(ready) {
    var vertexShader, fragmentShader;
    getShader('vertex.glsl', 'vertex', function(shader) {
        vertexShader = shader

        if(fragmentShader) {
            initShaderProgram(vertexShader, fragmentShader, ready)
        }
    });
    getShader('fragment.glsl', 'fragment', function(shader) {
        fragmentShader = shader;

        if(vertexShader) {
            initShaderProgram(vertexShader, fragmentShader, ready)
        }
    });
}

function initShaderProgram(vertexShader, fragmentShader, ready) {
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Could not initialise shaders');
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    updateUniforms();
    initVertexBuffer();
    ready();
}

function updateUniforms() {
    //light 1 position
    var uLight1DirLoc = gl.getUniformLocation(shaderProgram, 'uLight1Dir');
    gl.uniform3f(uLight1DirLoc, guiElems.light1DirX, guiElems.light1DirY, guiElems.light1DirZ);

    //light 1 colour
    var uLight1ColLoc = gl.getUniformLocation(shaderProgram, 'uLight1Color');
    gl.uniform3f(uLight1ColLoc, guiElems.light1Col[0] / 255, guiElems.light1Col[1] / 255, guiElems.light1Col[2] / 255);

    //light 1 flag
    var uLight1EnabLoc = gl.getUniformLocation(shaderProgram, 'uLight1Enabled');
    gl.uniform1i(uLight1EnabLoc, guiElems.light1Enab);

    //light 2 position
    var uLight2DirLoc = gl.getUniformLocation(shaderProgram, 'uLight2Dir');
    gl.uniform3f(uLight2DirLoc, guiElems.light2DirX, guiElems.light2DirY, guiElems.light2DirZ);

    //light 2 colour
    var uLight2ColLoc = gl.getUniformLocation(shaderProgram, 'uLight2Color');
    gl.uniform3f(uLight2ColLoc, guiElems.light2Col[0] / 255, guiElems.light2Col[1] / 255, guiElems.light2Col[2] / 255);

    //light 1 flag
    var uLight2EnabLoc = gl.getUniformLocation(shaderProgram, 'uLight2Enabled');
    gl.uniform1i(uLight2EnabLoc, guiElems.light2Enab);

    //camera pos
    var uCameraPosLoc = gl.getUniformLocation(shaderProgram, 'uCameraPos');
    gl.uniform3f(uCameraPosLoc, guiElems.cameraPosX, guiElems.cameraPosY, guiElems.cameraPosZ);

    //o1 mat
    var uObjOneMatLoc = gl.getUniformLocation(shaderProgram, 'uObjectOneMaterial');
    gl.uniform1i(uObjOneMatLoc, guiElems.objectOneMat);

    //o1 col
    var uObjOneColLoc = gl.getUniformLocation(shaderProgram, 'uObjectOneColor');
    gl.uniform3f(uObjOneColLoc, guiElems.objectOneCol[0] / 255, guiElems.objectOneCol[1] / 255, guiElems.objectOneCol[2] / 255);

    //o2 mat
    var uObjTwoMatLoc = gl.getUniformLocation(shaderProgram, 'uObjectTwoMaterial');
    gl.uniform1i(uObjTwoMatLoc, guiElems.objectTwoMat);

    //o2 col
    var uObjTwoColLoc = gl.getUniformLocation(shaderProgram, 'uObjectTwoColor');
    gl.uniform3f(uObjTwoColLoc, guiElems.objectTwoCol[0] / 255, guiElems.objectTwoCol[1] / 255, guiElems.objectTwoCol[2] / 255);

    //o3 mat
    var uObjThreeMatLoc = gl.getUniformLocation(shaderProgram, 'uObjectThreeMaterial');
    gl.uniform1i(uObjThreeMatLoc, guiElems.objectThreeMat);

    // o3 col
    var uObjThreeColLoc = gl.getUniformLocation(shaderProgram, 'uObjectThreeColor');
    gl.uniform3f(uObjThreeColLoc, guiElems.objectThreeCol[0] / 255, guiElems.objectThreeCol[1] / 255, guiElems.objectThreeCol[2] / 255);

    //refractive index
    var uRefIndexLoc = gl.getUniformLocation(shaderProgram, 'uRefractiveIndex');
    gl.uniform1f(uRefIndexLoc, guiElems.refractiveIndex);
}

var squareVertexPositionBuffer;
function initVertexBuffer() {
    var vertices = new Float32Array([
         1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
        -1.0, -1.0
    ]);

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 2;
    squareVertexPositionBuffer.numItems = 4;
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

/*
    gui setup
*/

var gui = new dat.GUI();

var guiElems = {
    light1DirX: 5.0,
    light1DirY: 7.0,
    light1DirZ: 2.0,
    light1Col: [ 200, 200, 100 ],
    light1Enab: true,
    light2DirX: -3.0,
    light2DirY: 7.0,
    light2DirZ: -4.0,
    light2Col: [ 150, 150, 255 ],
    light2Enab: true,
    cameraPosX: 0.0,
    cameraPosY: 3.0,
    cameraPosZ: 6.0,
    canvasSize: 3,
    screenshot: function() {
        screenshot();
    },
    refractiveIndex: 0.9,
    objectOneMat: 1,
    objectOneCol: [ 200, 150, 100 ],
    objectTwoCol: [ 100, 100, 200 ],
    objectThreeCol: [ 100, 100, 200 ],
    objectTwoMat: 3,
    objectThreeMat: 4
};

function initGUI() {
    var f1 = gui.addFolder('Light Options');
    var f1_1 = f1.addFolder('Light 1 Options');
    var f1_2 = f1.addFolder('Light 2 Options');
    var f2 = gui.addFolder('Object Options');
    var f2_1 = f2.addFolder('Object 1 Options');
    var f2_2 = f2.addFolder('Object 2 Options');
    var f2_3 = f2.addFolder('Object 3 Options');
    var f3 = gui.addFolder('Render Options');

    var controllers = [
        f1_1.add(guiElems, 'light1DirX', -10.0, 10.0).name('X Position'),
        f1_1.add(guiElems, 'light1DirY', 0.1, 10.0).name('Y Position'),
        f1_1.add(guiElems, 'light1DirZ', -10.0, 10.0).name('Z Position'),
        f1_1.addColor(guiElems, 'light1Col').name('Colour'),
        f1_1.add(guiElems, 'light1Enab').name('Enable'),
        f1_2.add(guiElems, 'light2DirX', -10.0, 10.0).name('X Position'),
        f1_2.add(guiElems, 'light2DirY', 0.1, 10.0).name('Y Position'),
        f1_2.add(guiElems, 'light2DirZ', -10.0, 10.0).name('Z Position'),
        f1_2.addColor(guiElems, 'light2Col').name('Colour'),
        f1_2.add(guiElems, 'light2Enab').name('Enable'),
        f2.add(guiElems, 'refractiveIndex', 0.0, 1.0).name('Refractive Index'),
        f2_1.add(guiElems, 'objectOneMat', {
            matte: 1,
            shiny: 3,
            glass: 4
        }).name('Material'),
        f2_1.addColor(guiElems, 'objectOneCol').name('Colour'),
        f2_2.add(guiElems, 'objectTwoMat', {
            matte: 1,
            shiny: 3,
            glass: 4
        }).name('Material'),
        f2_2.addColor(guiElems, 'objectTwoCol').name('Colour'),
        f2_3.add(guiElems, 'objectThreeMat', {
            matte: 1,
            shiny: 3,
            glass: 4
        }).name('Material'),
        f2_3.addColor(guiElems, 'objectThreeCol').name('Colour'),
    ];

    for (var i = 0; i < controllers.length; i++) {
        controllers[i].onChange(function() {
            update();
        });
    }

    var sizeController = f3.add(guiElems, 'canvasSize', {
        small: 0,
        medium: 1,
        large: 2,
        fullscreen: 3
    }).name('Canvas Size');
    sizeController.onFinishChange(function(val) {
        console.log(val);
        switch(val) {
            case '0': // 400 * 400
                console.log(val, 0);
                resizeCanvas(400, 400);
                break;
            case '1': // 640 * 480
                console.log(val, 1);
                resizeCanvas(640, 480);
                break;
            case '2': // 1080 * 720
                console.log(val, 2);
                resizeCanvas(1080, 720);
                break;
            default: // fullscreen
                console.log(val, 3);
                resizeCanvas();
                break;
        }
    });

    f3.add(guiElems, 'screenshot').name('Screenshot');
}

/*
    program functions
*/

function resizeCanvas(width, height) {
    if(typeof width === 'undefined') {
        width = window.innerWidth;
        height = window.innerHeight;
    }

    canvas.width = width;
    canvas.height = height;
    gl.viewportWidth = width;
    gl.viewportHeight = height;
    var uResolutionLoc = gl.getUniformLocation(shaderProgram, 'uResolution');
    gl.uniform2f(uResolutionLoc, width, height);

    draw();
}

var new_x, new_x2, new_y, new_y2, old_x, old_x2, old_y, old_y2, clicked = false, dragged = false;
function mouseDown(event) {
    new_x = old_x = event.pageX - canvas_rect.left;
    new_y = old_y = event.pageY - canvas_rect.top;
    clicked = true;
}

function mouseMove(event) {
    new_x = event.pageX - canvas_rect.left;
    new_y = event.pageY - canvas_rect.top;

    if(clicked) {
        var diffX = (new_x - old_x) / canvas.height * 5;
        guiElems.cameraPosX += diffX;
        var diffY = (new_y - old_y) / canvas.height * 20;
        var temp = guiElems.cameraPosY + diffY;

        if(temp > 1 && temp < 10) {
            guiElems.cameraPosY = temp;
        }

        update();
    }

    old_x = new_x;
    old_y = new_y;
}

function mouseUp(event) {
    clicked = dragged = false;
}

function mouseWheel(wheel) {
    var wheel = event.wheelDelta;
    var temp = guiElems.cameraPosZ - wheel * 0.005;

    if(temp > 4 && wheel && temp < 10) {
     guiElems.cameraPosZ = temp;
    }

    update();
}

function touchStart(event) {
    event.preventDefault();

    if(event.targetTouches.length === 1) {
        id1 = event.targetTouches[0].identifier;
        new_x = old_x = event.targetTouches[0].pageX - canvas_rect.left;
        new_y = old_y = event.targetTouches[0].pageY - canvas_rect.top;
    } else if(event.targetTouches.length === 2) {
        id1 = event.targetTouches[0].identifier;
        id2 = event.targetTouches[1].identifier;
        new_x = old_x = event.targetTouches[0].pageX - canvas_rect.left;
        new_y = old_y = event.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = old_x2 = event.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = old_y2 = event.targetTouches[1].pageY - canvas_rect.top;
    }

}

function touchMove(event) {
    event.preventDefault();

    if(event.targetTouches.length === 1) {
        new_x = event.targetTouches[0].pageX - canvas_rect.left;
        new_y = event.targetTouches[0].pageY - canvas_rect.top;

        if(event.targetTouches[0].identifier === id1) {
            var diffX = (new_x - old_x) / canvas.height * 5;
            guiElems.cameraPosX += diffX;
            var diffY = (new_y - old_y) / canvas.height * 20;
            var temp = guiElems.cameraPosY + diffY;

            if(temp > 1 && temp < 10) {
                guiElems.cameraPosY = temp;
            }

            update();
        } else {
            id1 = event.targetTouches[0].identifier;
        }

        old_x = new_x;
        old_y = new_y;
    } else if(event.targetTouches.length === 2) {
        new_x = event.targetTouches[0].pageX - canvas_rect.left;
        new_y = event.targetTouches[0].pageY - canvas_rect.top;
        new_x2 = event.targetTouches[1].pageX - canvas_rect.left;
        new_y2 = event.targetTouches[1].pageY - canvas_rect.top;

        if(event.targetTouches[0].identifier === id1 && event.targetTouches[1].identifier === id2) {
            var xPinchOld = old_x - old_x2;
            var yPinchOld = old_y - old_y2;
            var pinchOld = Math.sqrt(xPinchOld * xPinchOld + yPinchOld * yPinchOld);
            var xPinchNew = new_x - new_x2;
            var yPinchNew = new_y - new_y2;
            var pinchNew = Math.sqrt(xPinchNew * xPinchNew + yPinchNew * yPinchNew);
            var xDist = (new_x + new_x) / 2 / canvas.width;
            var yDist = (new_y + new_y2) / 2 / canvas.height;
            var temp = guiElems.cameraPosZ + (1 - pinchNew / pinchOld) * 2;

            if(temp > 4 && temp < 10) {
                guiElems.cameraPosZ = temp;
            }

            update();
        } else {
            id1 = event.targetTouches[0].identifier;
            id2 = event.targetTouches[0].identifier;
        }

        old_x = new_x;
        old_y = new_y;
        old_x2 = new_x2;
        old_y2 = new_y2;
    }
}

function touchEnd(event) { event.preventDefault(); }

var popup = document.querySelector('.popup'),
    popupWrap = document.querySelector('.popup-wrap'),
    currentAction, currentTimeout;

popupWrap.addEventListener('click', function(e) {
    if(e.target === popupWrap) { removeDialog(); }
});

window.addEventListener('keyup', function(e) {
    if(e.keyCode === '27') { removeDialog(); }
});

function printDialog( content, action, timeout ) {
    popup.innerHTML = content;

    if(action) {
        currentAction = action;
        popup.addEventListener('click', action);
    }

    if(timeout) { currentTimeout = setTimeout( removeDialog, timeout ); }

    document.body.classList.add('popup-active');
}

function removeDialog() {
    document.body.classList.remove('popup-active');
    popup.removeEventListener('click', currentAction);
    clearTimeout(currentTimeout);
}

currentTimeout = setTimeout(removeDialog, 20000);

function screenshot() {
    var data = canvas.toDataURL('image/png');
    printDialog('<p>Click <a href="' + data + '" download="screenshot">here</a> to download the screenshot.</p>');
}

/*
    update functions
*/

function update() {
    updateUniforms();
    draw();
}

function draw() {
    requestAnimationFrame(function() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
    });
}

/*
    program start
*/

var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseUp);
canvas.addEventListener('mousewheel', function(event){
    mouseWheel(event.wheelDelta);
    event.preventDefault();
}, false);
canvas.addEventListener('DOMMouseScroll', function(event){
    mouseWheel(event.detail * 10);
    event.preventDefault();
}, false);
canvas.addEventListener('touchstart', touchStart);
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchleave', touchEnd);
canvas.addEventListener('touchmove', touchMove);

initGUI();
initGL(canvas);
initShaders(resizeCanvas);
var canvas_rect = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);

window.addEventListener('resize', function() {
    if(guiElems.canvasSize === 3) {
        resizeCanvas();
    }
});
