var COMPUTER_NAME = {
	'AI_tenko' : 'てんこ',
	'AI_anko' : 'あんこ'
};



// てんこ
var AI_tenko = function(){
	// ランダムで開けるだけ
	randomOpen();
};

// あんこ
var AI_anko = function(){
	// 最も爆弾の残り数が多そうなところを攻める
	var data;
	var last = false;
	var lastPos = false;
	var tempLast = 0;
	for(var i = 0; i < MAP_WIDTH; i++){
		for(var j = 0; j < MAP_HEIGHT; j++){
			if(0 < cells[i][j].status && cells[i][j].status <= 8){
				data = getAroundData(i, j);
				tempLast = cells[i][j].status - (data.humanFlag + data.comFlag);
				if(tempLast > 0 && (last === false || last < tempLast)){
					last = tempLast;
					lastPos = {'x' : i, 'y' : j};
				}
			}
		}
	}

	// 可能性のありそうなところの周りを開ける
	if(lastPos !== false){
		var blankList = getAroundBlankPos(lastPos.x, lastPos.y);
		blankList.shuffle();
		cells[blankList[0].x][blankList[0].y].open(true);
	}
	// なければランダム
	else {
		randomOpen();
	}

};

function randomOpen(){
	// ランダムで開ける
	var list = new Array();
	for(var i = 0; i < MAP_WIDTH; i++){
		for(var j = 0; j < MAP_HEIGHT; j++){
			if(cells[i][j].status == CELL_BLANK){
				list.push(i+j*MAP_WIDTH);
			}
		}
	}

	list.shuffle();
	var cellNum = list.pop();
	cells[cellNum%MAP_WIDTH][Math.floor(cellNum/MAP_WIDTH)].open(true);
}

function getAroundBlankPos(x, y){
	var results = new Array();
	for(var i = -1; i <= 1; i++){
		for(var j = -1; j <= 1; j++){
			if(!(i == 0 && j == 0) &&
				x+i >= 0 && x+i < MAP_WIDTH &&
				y+j >= 0 && y+j < MAP_HEIGHT &&
				cells[x+i][y+j].status == CELL_BLANK){

				results.push({'x' : x+i, 'y' : y+j});
			}
		}
	}

	return results;
};

function getAroundData(x, y){
	var data = {
		'humanFlag' : 0,
		'comFlag' : 0,
		'blank' : 0,
		'opened' : 0
	};

	for(var i = -1; i <= 1; i++){
		for(var j = -1; j <= 1; j++){
			if(!(i == 0 && j == 0) &&
				x+i >= 0 && x+i < MAP_WIDTH &&
				y+j >= 0 && y+j < MAP_HEIGHT){

				if(cells[x+i][y+j].status == CELL_HUMAN) data.humanFlag++;
				else if(cells[x+i][y+j].status == CELL_COMPUTER) data.comFlag++;
				else if(0 <= cells[x+i][y+j].status && cells[x+i][y+j].status <= 8) data.opened++;
				else if(cells[x+i][y+j].status == CELL_BLANK) data.blank++;
			}
		}
	}

	return data;
};