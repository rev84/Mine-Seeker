var MAP_WIDTH = 0;
var MAP_HEIGHT = 0;
var AI_func = false;
var AI_NAME = false;

var BOMB_AMOUNT = 0;
var BOMB_PERSENT = 0.2;
var BOMB_DATA = new Object();

var CELL_BLANK = -1;
var CELL_HUMAN = -2;
var CELL_COMPUTER = -3;

var CELL_WIDTH = 30;
var CELL_HEIGHT = 30;

var PLAYER_HUMAN = CELL_HUMAN;
var PLAYER_COMPUTER = CELL_COMPUTER;

var cells = new Array();
var scores = new Object();

var nowTurn = PLAYER_HUMAN;

var sound = new Object();

var canClick = false;
var computerTimer = false;
var readyTimer = false;

var image = new Object();

$(document).ready(function() {
	$(window).resize(function(){
		repos();
	});

	$('#setup').dialog({
		autoOpen: false,
		title: 'ゲーム設定',
		closeOnEscape: false,
		modal: false,
		width: 800,
		minWidth: 720,
		resizable : false,
		buttons: {
			"開始": function(){
				if(!($('#width').val().match(/^[1-9][0-9]*$/))) return;
				if(!($('#height').val().match(/^[1-9][0-9]*$/))) return;
				if(!($('#minePer').val().match(/^[1-9][0-9]*$/))) return;
				if($('#ai').val() == "" || typeof(eval($('#ai').val())) != 'function') return;

				MAP_WIDTH = Number($('#width').val());
				MAP_HEIGHT = Number($('#height').val());
				BOMB_PERSENT = Number($('#minePer').val()) / 100;
				AI_NAME = $('#ai').val();
				AI = eval($('#ai').val());

				$(this).dialog('close');
				imageLoad();
				readyTimer = setInterval('preInit()', 10);
			}
		}
	});
	$('#humanTurn').dialog({
		autoOpen: false,
		title: 'おしらせ',
		closeOnEscape: false,
		modal: false,
		width: 400,
		minWidth: 400,
		maxWidth: 400
	});
	$('#comTurn').dialog({
		autoOpen: false,
		title: 'おしらせ',
		closeOnEscape: false,
		modal: false,
		width: 400,
		minWidth: 400,
		maxWidth: 400
	});
	$('#humanWin').dialog({
		autoOpen: false,
		title: '決着',
		closeOnEscape: false,
		modal: false,
		width: 400,
		minWidth: 400,
		maxWidth: 400
	});
	$('#comWin').dialog({
		autoOpen: false,
		title: '決着',
		closeOnEscape: false,
		modal: false,
		width: 400,
		minWidth: 400,
		maxWidth: 400
	});
	$('#ai').change(function(){
		$('#aiDesc').html($('#desc_'+$(this).val()).html());
	});

	$('#setup').dialog('open');
});

Array.prototype.shuffle = function(){
	var i = this.length;
	while(i){
		var j = Math.floor(Math.random()*i);
		var t = this[--i];
		this[i] = this[j];
		this[j] = t;
	}
	return this;
};

function preInit(){
	var readyFlag = true;

	for(var key in image){
		if(!image[key].complete) readyFlag = false;
	}

	if(readyFlag){
		clearInterval(readyTimer);
		readyTimer = false;
		init();
		turnStart(true);
	}
}

function imageLoad(){
	// 画像
	for(var key in imageList){
		image[key] = new Image();
		image[key].src = imageList[key]+'?'+new Date().getTime();
	}
}

function initScore(){
	scores = {
		human : new Score('human', 'あなた', true, 0, 220),
		com : new Score(AI_NAME, COMPUTER_NAME[AI_NAME], false, 0, 0),
		total : new Total()
	};
}

var Total = function(){
	this.canvas = document.createElement('canvas');
	this.canvas.width = 200;
	this.canvas.height = 100;

	this.canvas.style.position = 'absolute';
	this.canvas.style.left = '0px';
	this.canvas.style.top = '110px';

	this.ctx = this.canvas.getContext('2d');
	this.ctx.textBaseline = 'top';

	$('#score').append(this.canvas);

	this.update = function(){
		var last = BOMB_DATA.last;
		var amount = BOMB_AMOUNT;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(image.bombIcon, 0, 0);

		this.ctx.font = "50px 'ＭＳ Ｐゴシック'";
		this.ctx.fillStyle = "#AAAAFF";
		this.ctx.shadowColor = "#000000";
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowBlur = 1;
		this.ctx.fillText(last, (this.canvas.width-(this.ctx.measureText(last)).width)/2-21, 25);

		// 合計
		this.ctx.font = "30px 'ＭＳ Ｐゴシック'";
		this.ctx.fillStyle = "#000000";
		this.ctx.shadowColor = "#0000FF";
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowBlur = 0;
		this.ctx.fillText('/ '+amount, this.canvas.width-(this.ctx.measureText('/ '+amount)).width-20, this.canvas.height-30-20);
	};
};

var Score = function(name, viewName, isHuman, posX, posY){
	this.name = name;
	this.viewName = viewName;
	this.posX = posX;
	this.posY = posY;
	this.isHuman = isHuman;

	this.canvas = document.createElement('canvas');
	this.canvas.width = 200;
	this.canvas.height = 100;

	this.canvas.style.position = 'absolute';
	this.canvas.style.left = ''+(posX)+'px';
	this.canvas.style.top = ''+(posY)+'px';
	this.canvas.style.border = 'dotted 3px #000';

	this.ctx = this.canvas.getContext('2d');
	this.ctx.textBaseline = 'top';

	$('#score').append(this.canvas);

	this.faceImageName = this.name;

	this.update = function(){
		// 手番を示す
		if((this.isHuman && nowTurn == PLAYER_HUMAN)||(!this.isHuman && nowTurn == PLAYER_COMPUTER)){
			this.canvas.style.border = 'double 3px #F00';
		} else {
			this.canvas.style.border = 'dotted 3px #000';
		}

		var setImage = image[this.faceImageName];
		var bombImage = image[this.name+'_bomb'];
		var amount = this.isHuman ? BOMB_DATA.human : BOMB_DATA.com;

		var scale = this.canvas.height / setImage.height;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// 顔
		this.ctx.drawImage(setImage, 0, 0, setImage.width * scale, setImage.height * scale);

		// 名前
		this.ctx.font = "30px 'ＭＳ Ｐゴシック'";
		this.ctx.fillStyle = "#FF0000";
		this.ctx.shadowColor = "#0000FF";
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowBlur = 5;
		this.ctx.fillText(this.viewName, this.canvas.width-(this.ctx.measureText(this.name)).width, this.canvas.height-30);

		// 爆弾の数
		this.ctx.font = "30px 'ＭＳ Ｐゴシック'";
		this.ctx.fillStyle = "#000000";
		this.ctx.shadowColor = "#F1F1F1";
		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;
		this.ctx.shadowBlur = 5;
		this.ctx.fillText(amount, this.canvas.width-(this.ctx.measureText(""+amount).width), 0);
		this.ctx.drawImage(bombImage, this.canvas.width-(this.ctx.measureText(""+amount).width)-30, 0, 30, 30);

	};

	this.changeFace = function(type){
		this.faceImageName = this.name+type;
	};
};

function turnStart(firstTurn){
	if(firstTurn){
		var dialogObj = nowTurn == PLAYER_HUMAN ? $('#humanTurn') : $('#comTurn');
		dialogObj.dialog('open');
	}
	updateScore();
	if(firstTurn){
		setTimeout(function(){
			dialogObj.dialog('close');
			if(nowTurn == PLAYER_HUMAN){
				canClick = true;
			}
			else{
				computerTimer = setInterval('AI()', 2000);
			}
		}, 1500);
	} else {
		if(nowTurn == PLAYER_HUMAN){
			canClick = true;
			initClicked(PLAYER_HUMAN);
		}
		else{
			computerTimer = setInterval('AI()', 2000);
			initClicked(PLAYER_COMPUTER);
		}
	}
}

function changeTurn(){
	if(nowTurn == PLAYER_HUMAN) nowTurn = PLAYER_COMPUTER;
	else nowTurn = PLAYER_HUMAN;
	if(computerTimer !== false){
		clearInterval(computerTimer);
		computerTimer = false;
	}
}

function init(){
	// 爆弾の数を決める
	BOMB_AMOUNT = Math.ceil(MAP_WIDTH*MAP_HEIGHT*BOMB_PERSENT);
	if(BOMB_AMOUNT % 2 == 0) BOMB_AMOUNT--;

	// 爆弾の位置を決める
	var bombTemp = new Array();
	var bombTrueTemp = new Array();
	for(var b = 0; b < MAP_WIDTH*MAP_HEIGHT; b++){
		bombTemp.push(b);
		bombTrueTemp[b] = false;
	}
	bombTemp.shuffle();
	for(var i = 0; i < BOMB_AMOUNT; i++) bombTrueTemp[bombTemp[i]] = true;

	// ゲーム画面の位置
	repos();

	// マップの初期化
	for(var i = 0; i < MAP_WIDTH; i++){
		cells[i] = new Array();
		for(var j = 0; j < MAP_HEIGHT; j++){
			cells[i][j] = new Cell(i, j, bombTrueTemp[i*MAP_WIDTH+j]);
		}
	}

	// スコアの初期化
	initScore();

	// 先攻を決める
	nowTurn = Math.random() >= 0.5 ? PLAYER_HUMAN : PLAYER_COMPUTER;
}


var Cell = function(x, y, bomb){
	this.x = x;
	this.y = y;
	this.status = CELL_BLANK;
	this.bomb = bomb;

	this.humanClicked = false;
	this.computerClicked = false;
	this.check = 0;

	this.canvas = document.createElement('canvas');
	this.canvas.width = CELL_WIDTH;
	this.canvas.height = CELL_HEIGHT;

	this.canvas.style.position = 'absolute';
	this.canvas.style.left = ''+(x * (CELL_WIDTH+2))+'px';
	this.canvas.style.top = ''+(y * (CELL_HEIGHT+2))+'px';
	this.canvas.style.zIndex = 10;

	this.ctx = this.canvas.getContext('2d');
	this.ctx.textBaseline = 'top';

	$('#game').append(this.canvas);

	var _this = this;
	this.canvas.addEventListener('click', function(e){
		if(canClick) _this.open(true);
	});
	this.canvas.addEventListener('mouseover', function(e){
		if(_this.status == CELL_BLANK){
			_this.canvas.style.border = 'solid 3px #F00';
			_this.canvas.style.left = ''+(_this.x * (CELL_WIDTH+2)-2)+'px';
			_this.canvas.style.top = ''+(_this.y * (CELL_HEIGHT+2)-2)+'px';
			_this.canvas.style.zIndex = 20;
		}
	});
	this.canvas.addEventListener('mouseout', function(e){
		_this.setBorderColor();
	});

	$(this.canvas).bind('contextmenu', function(e){
		if(_this.status == CELL_BLANK){
			if(_this.check < 2) _this.check++;
			else _this.check = 0;
		}
		_this.animation();

		return false;
	});



	this.open = function(canOpenBomb){
		var player = nowTurn;
		// まだ開けられていないセル
		if(this.status == CELL_BLANK){
			canClick = false;

			// 爆弾が埋まっている
			if(this.bomb && canOpenBomb){
				this.status = player;

				if(canOpenBomb){
					if(player == PLAYER_HUMAN){
						playSound('humanGet');
						canClick = true;
					}
					else playSound('comGet');

					this.setPlayerClicked(nowTurn);
				}
				this.animation();
				updateScore();
				judge();
			}
			// 空
			else {
				this.status = this.getAroundBomb();
				if(this.status == 0){
					for(var i = -1; i <= 1; i++){
						for(var j = -1; j <= 1; j++){
							if(!(i == 0 && j == 0) &&
								this.x+i >= 0 && this.x+i < MAP_WIDTH &&
								this.y+j >= 0 && this.y+j < MAP_HEIGHT){

								cells[x+i][y+j].open(false);
							}
						}
					}
				}
				if(canOpenBomb) this.setPlayerClicked(nowTurn);
				this.animation();
				if(canOpenBomb){
					playSound('endTurn');

					changeTurn();
					turnStart(false);
				}
			}

		}
	};

	this.animation = function(answer){

		this.setBorderColor();

		if(this.status == CELL_BLANK){
			this.ctx.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image.blank, 0, 0, CELL_WIDTH, CELL_HEIGHT);
			if(answer && this.bomb){
				this.ctx.drawImage(image['answer_bomb'], 0, 0, CELL_WIDTH, CELL_HEIGHT);
			} else if(this.check == 1 || this.check == 2){
				this.ctx.drawImage(image['check'+this.check], 0, 0, CELL_WIDTH, CELL_HEIGHT);
			}
		}
		else if(this.status == CELL_HUMAN){
			this.ctx.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image.blank, 0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image['human_bomb'], 0, 0, CELL_WIDTH, CELL_HEIGHT);
		}
		else if(this.status == CELL_COMPUTER){
			this.ctx.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image.blank, 0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image[AI_NAME+'_bomb'], 0, 0, CELL_WIDTH, CELL_HEIGHT);
		}
		else {
			this.ctx.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
			this.ctx.drawImage(image.opened, 0+(this.status%5)*67, 0+Math.floor(this.status/5)*67, 67, 67, 0, 0, CELL_WIDTH, CELL_HEIGHT);
		}
	};

	this.getAroundBomb = function(){
		var count = 0;
		for(var i = -1; i <= 1; i++){
			for(var j = -1; j <= 1; j++){
				if(!(i == 0 && j == 0) &&
					this.x+i >= 0 && this.x+i < MAP_WIDTH &&
					this.y+j >= 0 && this.y+j < MAP_HEIGHT &&
					cells[x+i][y+j].bomb){

					count++;
				}
			}
		}

		return count;
	};

	this.setBorderColor = function(){
		// 境界線の色を変える
		if(this.humanClicked){
			_this.canvas.style.border = 'solid 3px #0FF';
			_this.canvas.style.left = ''+(_this.x * (CELL_WIDTH+2)-2)+'px';
			_this.canvas.style.top = ''+(_this.y * (CELL_HEIGHT+2)-2)+'px';
			_this.canvas.style.zIndex = 20;
		}
		else if(this.computerClicked){
			_this.canvas.style.border = 'solid 3px #F0F';
			_this.canvas.style.left = ''+(_this.x * (CELL_WIDTH+2)-2)+'px';
			_this.canvas.style.top = ''+(_this.y * (CELL_HEIGHT+2)-2)+'px';
			_this.canvas.style.zIndex = 20;
		}
		else {
			_this.canvas.style.border = 'solid 1px #000';
			_this.canvas.style.left = ''+(_this.x * (CELL_WIDTH+2))+'px';
			_this.canvas.style.top = ''+(_this.y * (CELL_HEIGHT+2))+'px';
			_this.canvas.style.zIndex = 10;
		}
	};

	this.setPlayerClicked = function(player){
		// クリックしたことを登録
		if(player == PLAYER_HUMAN){
			this.humanClicked = true;
		} else {
			this.computerClicked = true;
		}
	};

	this.animation();
};

// 残りの爆弾の数などを返す
function updateBombData(){
	var last = BOMB_AMOUNT;
	var human = 0;
	var com = 0;

	for(var i = 0; i < MAP_WIDTH; i++){
		for(var j = 0; j < MAP_HEIGHT; j++){
			if(cells[i][j].bomb && cells[i][j].status != CELL_BLANK) last--;
			if(cells[i][j].status == CELL_HUMAN) human++;
			else if(cells[i][j].status == CELL_COMPUTER) com++;
		}
	}

	BOMB_DATA = {'last' : last, 'human' : human, 'com' : com };
}

function updateScore(){
	updateBombData();
	scores.human.update();
	scores.com.update();
	scores.total.update();
}

function playSound(name){
	var audio = new Audio(soundResource[name]);
	audio.play();
}

function initClicked(player){
	var property = player == CELL_HUMAN ? 'humanClicked' : 'computerClicked';
	for(var i = 0; i < MAP_WIDTH; i++){
		for(var j = 0; j < MAP_HEIGHT; j++){
			cells[i][j][property] = false;
			cells[i][j].animation();
		}
	}
}

function repos(){
	var posLeft = ($(window).width() - (200 + MAP_HEIGHT*(CELL_HEIGHT+1)))/2;
	posLeft = posLeft < 0 ? 0 : posLeft;
	$('#main').css({"position" : "absolute", "left" : ''+posLeft+'px'});
}

function judge(){
	if(BOMB_DATA.human >= BOMB_AMOUNT/2 || BOMB_DATA.com >= BOMB_AMOUNT/2){
		var audio = BOMB_DATA.human >= BOMB_AMOUNT/2 ? new Audio('./sound/win.ogg') : new Audio('./sound/lose.ogg');
		var timer = setInterval(function(){
			if(audio.readyState == 4){
				clearInterval(timer);
				audio.play();
			}
		}, 100);
		if(BOMB_DATA.human >= BOMB_AMOUNT/2) $('#humanWin').dialog('open');
		else $('#comWin').dialog('open');

		clearInterval(computerTimer);
		canClick = false;

		for(var i = 0; i < MAP_WIDTH; i++){
			for(var j = 0; j < MAP_HEIGHT; j++){
				cells[i][j].animation(true);
			}
		}
	}
}













