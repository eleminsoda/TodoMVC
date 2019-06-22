window.model = {
    data: {
        items: []
        // {msg: '', completed: true/false}
    },
    TOKEN: "TODO"
};

(function () {
    let model = window.model;
    let storage = window.localStorage;

    Object.assign(model, {
        init: function (callback) {
            var data = storage.getItem(model.TOKEN);
            try {
                if (data) model.data = JSON.parse(data);
            } catch (e) {
                storage.setItem(model.TOKEN, '');
                console.error(e);
            }

            if (callback) callback();
        },
        flush: function (callback) {
            try {
                storage.setItem(model.TOKEN, JSON.stringify(model.data));
            } catch (e) {
                console.error(e);
            }
            if (callback) callback();
        }
    });
})();

const completeSVG = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32.296 32.296" style="enable-background:new 0 0 32.296 32.296;" xml:space="preserve"><g><path d="M31.923,9.14L13.417,27.642c-0.496,0.494-1.299,0.494-1.793,0L0.37,16.316c-0.494-0.496-0.494-1.302,0-1.795l2.689-2.687c0.496-0.495,1.299-0.495,1.793,0l7.678,7.729L27.438,4.654c0.494-0.494,1.297-0.494,1.795,0l2.689,2.691C32.421,7.84,32.421,8.646,31.923,9.14z"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>';
const SHAKE_SPEED = 300;
let lastTime = 0; //position changed last time
let x = y = z = lastX = lastY = lastZ = 0; // position variables

function finishAllTasks() {
    let items = model.data.items;

    items.forEach(item => {
        if (!item.completed) {
            item.completed = true;
        }
    });

    update();
}

function unfinishAllTasks() {
    let items = model.data.items;

    items.forEach(item => {
        if (item.completed) {
            item.completed = false;
        }
    });

    update();
}

function deleteAllFinishedTasks() {
    let items = model.data.items;

    model.data.items = items.filter(item => item.completed == false);

    update();
}

function motionHandler(event) {
    let acceleration = event.accelerationIncludingGravity;
    let curTime = Date.now(); 
    if ((curTime - lastTime) > 120) {
        let diffTime = curTime - lastTime;
        lastTime = curTime;
        x = acceleration.x;
        y = acceleration.y;
        z = acceleration.z;
        
        let speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 1000;
        if (speed > SHAKE_SPEED) {
            $('#shakeAudio').trigger('play');
            deleteAllFinishedTasks();
        }
        lastX = x;
        lastY = y;
        lastZ = z;
    }
}

function changeItemStatus(buttonItem) {
    let itemID = $(buttonItem).parent().parent().attr('id');
    let dataIndex = parseInt(itemID.slice(5));
    let itemNewText = $(buttonItem).parent().find('input')[0].value;
    model.data.items[dataIndex].msg = itemNewText;

    let itemMsg = model.data.items[dataIndex].msg;
    let itemNewStatus = !model.data.items[dataIndex].completed;

    if (itemNewStatus) {
        $('#finishAudio').trigger('play');
    }

    model.data.items.splice(dataIndex, 1);
    model.data.items.push({
        msg: itemMsg,
        completed: itemNewStatus
    });

    update();
}

function deleteItem(item) {
    let itemID = $(item).attr('id');
    let itemIndex = parseInt(itemID.slice(5));

    model.data.items.splice(itemIndex, 1);
    $('#deleteAudio').trigger('play');

    update();
}

function update() {
    model.flush();
    let items = model.data.items;

    $('#text').val('');
    $('#incompleted').html('');
    $('#completed').html('');

    items.forEach((itemData, index) => {
        // create list item
        let item = document.createElement('li');
        item.id = "item_" + index;

        let itemEntangle = document.createElement('div');
        itemEntangle.classList.add('entangle');

        let itemDiv = document.createElement('div');
        itemDiv.classList.add('item-text');
        let itemDivInput = document.createElement('input');
        itemDivInput.setAttribute('type', 'text');
        if (itemData.completed) {
            itemDivInput.setAttribute('readonly', 'readonly');
            itemDivInput.setAttribute('onfocus', 'this.blur()');
        }
        itemDivInput.value = itemData.msg;

        let span1 = document.createElement('span');
        let span2 = document.createElement('span');
        let span3 = document.createElement('span');
        let span4 = document.createElement('span');
        span1.classList.add('bottom');
        span2.classList.add('right');
        span3.classList.add('top');
        span4.classList.add('left');

        itemDiv.appendChild(itemDivInput);
        itemDiv.append(span1);
        itemDiv.append(span2);
        itemDiv.append(span3);
        itemDiv.append(span4);
        itemEntangle.appendChild(itemDiv);

        let itemButton = document.createElement('button');
        let hammertap = new Hammer(itemButton);
        hammertap.on('tap', function () {
            changeItemStatus(itemButton);
        });
        itemButton.innerHTML = completeSVG;

        itemEntangle.appendChild(itemButton);
        item.appendChild(itemEntangle);

        let hammertime = new Hammer(item)
        hammertime.on('swipeleft', function () {
            deleteItem(item);
        })

        // append list item to according list
        if (!itemData.completed) {
            $('#incompleted').prepend(item);
        } else {
            $('#completed').prepend(item);
        }
    });

    if ($("#incompleted>li").length == 0) {
        if ($("#completed>li").length == 0) {
            $('#finish-all').hide();
            $('#unfinish-all').hide();
            $('#delete-all').hide();
        } else {
            $('#finish-all').hide();
            $('#unfinish-all').show();
            $('#delete-all').show();
            $('#unfinish-all').css('margin-left', $(window).width() / 2 - 170 + 'px');
            $('#delete-all').css('margin-left', '0');
            // $(window).resize(function () {
            //     $('#delete-all').css('margin-left', $(window).width() / 2 - 90 + 'px');
            // });
        }
    } else {
        if ($("#completed>li").length == 0) {
            $('#finish-all').show();
            $('#unfinish-all').hide();
            $('#delete-all').hide();
            $('#finish-all').css('margin-left', $(window).width() / 2 - 90 + 'px');
            // $(window).resize(function () {
            //     $('#finish-all').css('margin-left', $(window).width() / 2 - 90 + 'px');
            // });
        } else {
            $('#finish-all').show();
            $('#unfinish-all').show();
            $('#delete-all').show();
            $('#finish-all').css('margin-left', $(window).width() / 2 - 170 + 'px');
            $('#unfinish-all').css('margin-left', '0');
            $('#delete-all').css('margin-left', $(window).width() / 2 - 90 + 'px');
            // $(window).resize(function () {
            //     $('#finish-all').css('margin-left', $(window).width() / 2 - 170 + 'px');
            // });
        }
    }
}

window.onload = function () {
    model.init(function () {
        let data = model.data;

        // 之后要删掉！！！
        // data.items.splice(0, data.items.length);


        let hammertime2 = new Hammer(document.getElementById('add'));
        hammertime2.on('tap', function () {
            let text = $('#text').val();
            if (text == '') {
                alert('Please write something!');
                return;
            }

            data.items.push({
                msg: text,
                completed: false
            });
            update();
        })
        $('#finish-all').hide();
        $('#unfinish-all').hide();
        $('#delete-all').hide();

        let hammertap = new Hammer(document.getElementById('finish-all'));
        hammertap.on('tap', function () {
            finishAllTasks();
        });

        let hammertap2 = new Hammer(document.getElementById('unfinish-all'));
        hammertap2.on('tap', function () {
            unfinishAllTasks();
        });

        let hammertap1 = new Hammer(document.getElementById('delete-all'));
        hammertap1.on('tap', function () {
            deleteAllFinishedTasks();
        });

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', motionHandler, false);
        } else {
            alert("您当前使用的设备或浏览器不支持位置感应哦");
        }

        update();
    })
}