"use strict";

var onlinecomp = execMain(function() {
	var refreshButton = $('<input type="button" value="Get Competition List">').click(updateCompList);
	var compSelectDiv = $('<div>');
	var compProgressDiv = $('<div style="max-height: 10em; overflow-y: auto;">');
	var compMainButton = $('<input type="button">');
	var viewResultButton = $('<input type="button" value="View Result">');
	var pathSelect = [];
	var pathList = [];
	var compDict = {};

	function updatePathSelect(curPath, level) {
		while (pathSelect.length > level) {
			pathSelect.pop().remove();
		}
		var ret = getSelect(curPath, level);
		if (ret) {
			pathSelect[level] = ret;
			compSelectDiv.append(pathSelect[level]);
			updatePathSelect(curPath + '|' + pathSelect[level].val(), level + 1);
		}
	}

	function selectChange(e) {
		var level = $(e.target).prevAll('select').length;
		var curPath = '';
		for (var i = 0; i <= level; i++) {
			curPath = curPath + '|' + pathSelect[i].val();
		}
		updatePathSelect(curPath, level + 1);
		resetProgress();
		if (curPath == '|' + 'update competition list...') {
			updateCompList();
		}
	}

	function getSelect(curPath, level) {
		if (pathList.indexOf(curPath) != -1) {
			return null;
		}
		var values = [];
		curPath = curPath + '|';
		var curPathLen = curPath.length;
		var ret = $('<select style="max-width: unset;">');
		for (var i = 0; i < pathList.length; i++) {
			if (pathList[i].startsWith(curPath)) {
				var curValue = pathList[i].slice(curPathLen).split('|', 1)[0];
				if (values.indexOf(curValue) == -1) {
					values.push(curValue);
					ret.append($('<option>').val(curValue).html(curValue));
				}
			}
		}
		return values.length == 0 ? null : ret.change(selectChange);;
	}

	function updateCompList() {
		refreshButton.val('...');
		$.post('https://cstimer.net/comp.php', {
			'action': 'list'
		}, function(value) {
			pathList = [];
			value = JSON.parse(value)['data'];
			for (var i = 0; i < value.length; i++) {
				var compFullName = value[i]['fullname'];
				compDict[compFullName] = value[i]['name']
				var paths = JSON.parse(value[i]['value']);
				for (var j = 0; j < paths.length; j++) {
					pathList.push('|' + compFullName + '|' + paths[j]);
				}
			}
			pathList.push('|update competition list...');
			compDict['update competition list...'] = 'update';
			updatePathSelect('', 0);
			resetProgress();
			refreshButton.hide();
		}).error(function() {
			logohint.push('Network Error');
			refreshButton.val('Get Competition List');
		});
	}

	function getCompPath() {
		var curPath = '';
		for (var i = 0; i < pathSelect.length; i++) {
			curPath += '|' + pathSelect[i].val();
		}
		if (pathList.indexOf(curPath) == -1) {
			alert('Invalid Input');
			return;
		}
		var comp = curPath.slice(1).split('|', 1)[0];
		var path = curPath.slice(comp.length + 2);
		comp = compDict[comp];
		return [comp, path];
	}

	function fetchScramble() {
		var comppath = getCompPath();
		$.post('https://cstimer.net/comp.php', {
			'action': 'scramble',
			'comp': comppath[0],
			'path': comppath[1]
		}, function(value) {
			value = JSON.parse(value);
			if (value['retcode'] != 0 || !value['data']) {
				logohint.push(value['reason'] || 'Server Error');
				return;
			}
			var scrambles = value['data'];
			compScrambles = scrambles;
			compTypes = $.map(scrambles, function(val) {
				var m = /^\$T([a-zA-Z0-9]+)\$\s*(.*)$/.exec(val);
				return m ? scramble.getTypeName(m[1]) : '???';
			});
			clearProgress();
			kernel.setProp('scrType', 'remoteComp');
		}).error(function() {
			logohint.push('Network Error');
		});
	}

	var isInit = false;

	function execFunc(fdiv, e) {
		if (!fdiv || isInit) {
			isInit = !!fdiv;
			return;
		}
		fdiv.empty().append($('<div style="font-size: 0.75em;">').append(refreshButton, compSelectDiv, compProgressDiv, compMainButton, viewResultButton));
		updatePathSelect('', 0);
		resetProgress();
		isInit = true;
	}

	function resetProgress() {
		compScrambles = [];
		compTypes = [];
		clearProgress();
	}

	function clearProgress() {
		solves = [];
		submitted = false;
		updateProgress();
	}

	function updateProgress() {
		compMainButton.unbind('click');
		viewResultButton.unbind('click');
		if (pathSelect.length < 2) {
			compMainButton.attr('disabled', true).val('Start!');
			viewResultButton.attr('disabled', true);
		} else {
			compProgressDiv.empty();
			if (compTypes.length == 0) {
				if (!pathSelect[0].val().startsWith('*') && !pathSelect[0].val().startsWith('+')) {
					compMainButton.removeAttr('disabled').val('Start!').click(fetchScramble);
				} else {
					compMainButton.attr('disabled', true).val('Start!');
				}
			} else {
				for (var i = 0; i < compTypes.length; i++) {
					var m = /^\$T([a-zA-Z0-9]+)\$\s*(.*)$/.exec(compTypes[i]);
					compProgressDiv.append((i + 1) + '. ' + (solves[i] ? stats.pretty(solves[i][0]) : compTypes[i]), '<br>');
				}
				if (solves.length == compTypes.length && !submitted) {
					compMainButton.removeAttr('disabled');
					compMainButton.val('Submit!').click(submitSolves);
				} else {
					compMainButton.attr('disabled', true);
				}
			}
			viewResultButton.removeAttr('disabled').click(viewResult);
		}
		kernel.blur();
	}

	function submitSolves() {
		if (submitted) {
			return;
		}

		var uid = exportFunc.getDataId('wcaData', 'cstimer_token');
		if (!uid || !confirm('Submit As Your WCA Account? (Relogin if not recognized after submitting)')) {
			uid = prompt('Submit As: ', exportFunc.getDataId('locData', 'compid'));
			if (!exportFunc.isValidId(uid)) {
				alert(EXPORT_INVID);
				return;
			}
			localStorage['locData'] = JSON.stringify({ id: exportFunc.getDataId('locData', 'id'), compid: uid });
		}
		var comppath = getCompPath();
		$.post('https://cstimer.net/comp.php', {
			'action': 'submit',
			'comp': comppath[0],
			'path': comppath[1],
			'uid': uid,
			'value': JSON.stringify(solves)
		}, function(value) {
			if (value == '{"retcode":0}') {
				submitted = true;
				logohint.push('Submitted');
			} else {
				logohint.push('Network Error');
			}
		}).error(function() {
			logohint.push('Network Error');
		});
	}

	function viewResult() {
		if (solves.length != 0 && !submitted && !confirm('Abort competition and show results?')) {
			return;
		}
		resetProgress();
		var comppath = getCompPath();
		$.post('https://cstimer.net/comp.php', {
			'action': 'result',
			'comp': comppath[0],
			'path': comppath[1],
		}, function(value) {
			if (JSON.parse(value)['retcode'] !== 0) {
				logohint.push('Server Error');
				return;
			}
			var myid = $.sha256('cstimer_public_salt_' + exportFunc.getDataId('locData', 'compid'));
			var mywcaid = (exportFunc.getDataId('wcaData', 'wca_me') || {})['wca_id'];
			var curScrambles = JSON.parse(value)['scramble'];
			value = $.map(JSON.parse(value)['data'], function(val) {
				var solves = JSON.parse(val['value']);
				if (solves.length != 5) { //invalid data
					return;
				}
				var timestat = new TimeStat([5], solves.length, function(idx) {
					return solves[idx][0][0] == -1 ? -1 : (solves[idx][0][0] + solves[idx][0][1]);
				});
				timestat.getAllStats();
				return {
					'uid': val['uid'],
					'wca_id': val['wca_id'],
					'value': solves,
					'ao5': timestat.lastAvg[0][0],
					'bo5': timestat.bestTime
				};
			});
			value.sort(function(a, b) {
				var cmp1 = TimeStat.dnfsort(a['ao5'], b['ao5']);
				return cmp1 == 0 ? TimeStat.dnfsort(a['bo5'], b['bo5']) : cmp1;
			});

			var ret = ['<table class="table"><tr><th></th><th>User</th><th>ao5</th><th>bo5</th><th>Results</th></tr>'];
			for (var i = 0; i < value.length; i++) {
				var uid = value[i]['uid'];
				var solves = value[i]['value'];
				var ao5 = value[i]['ao5'];
				var bo5 = value[i]['bo5'];
				var wcaid = value[i]['wca_id'];
				ret.push('<tr><td>' + (i + 1) + '</td>');
				if (wcaid !== undefined) {
					if (!wcaid) {
						uid = 'WCA Account';
					} else {
						uid = '<a target="_blank" href="https://www.worldcubeassociation.org/persons/' + wcaid + '">' + wcaid + '</a>';
					}
					ret.push(wcaid == mywcaid ? '<th>Me:' + uid + '</th><td>' : '<td>' + uid + '</td><td>');
				} else {
					ret.push(uid == myid ? '<th>Me</th><td>' : '<td>Anonym</td><td>');
				}
				ret.push(kernel.pretty(ao5) + '</td><td>' + kernel.pretty(bo5) + '</td><td>');
				for (var j = 0; j < solves.length; j++) {
					if (solves[j].length > 4) { // from vrc or bluetooth
						solves[j][1] = scramble.scrStd('', curScrambles[j] || '')[1];
						ret.push('<a target="_blank" class="click" href="' + stats.getReviewUrl(solves[j]) + '">' + stats.pretty(solves[j][0]) + '</a> ');
					} else {
						ret.push(stats.pretty(solves[j][0]) + ' ');
					}
				}
				ret.push('</td>');
				ret.push('</tr>');
			}
			ret.push('</table>');
			compProgressDiv.empty().html(ret.join(''));
		}).error(function() {
			logohint.push('Network Error');
		});
	}

	var solves = [];
	var submitted = false;

	function procSignal(signal, value) {
		if (!isInit) {
			return;
		}
		value = JSON.parse(JSON.stringify(value));
		var curScr = value[1];
		value[1] = '';
		value[2] = '';
		if (signal == 'timestd') {
			for (var i = solves.length; i < compScrambles.length; i++) {
				var targetScr = scramble.scrStd('', compScrambles[i])[1];
				if (targetScr != curScr) {
					value[0] = [-1, 1];
					solves.push(value);
				} else {
					solves.push(value);
					break;
				}
			}
		} else if (signal == 'timepnt') {
			for (var i = 0; i < solves.length; i++) {
				var targetScr = scramble.scrStd('', compScrambles[i])[1];
				if (targetScr == curScr) {
					solves[i] = value;
					break;
				}
			}
		}
		updateProgress();
	}

	var compScrambles = [];
	var compTypes = [];

	function getScrambles() {
		if (solves.length == 0) {
			return compScrambles.slice();
		} else {
			return [];
		}
	}

	$(function() {
		tools.regTool('onlinecomp', 'Online Competition', execFunc);
		kernel.regListener('onlinecomp', 'timestd', procSignal);
		kernel.regListener('onlinecomp', 'timepnt', procSignal);
	});

	return {
		getScrambles: getScrambles
	}
});