
  const config = {
    apiKey: "AIzaSyAeAP0u5Gj5PhHNiTuz8EZqWPQ5PKjMooc",
    authDomain: "ut-coding-hw7.firebaseapp.com",
    databaseURL: "https://ut-coding-hw7.firebaseio.com",
    projectId: "ut-coding-hw7",
    storageBucket: "ut-coding-hw7.appspot.com",
    messagingSenderId: "870885508055"
  };
  firebase.initializeApp(config);



const database         = firebase.database();
const database_players = database.ref("players");
const database_turn    = database.ref("turn");
const database_chat    = database.ref("chat");
const numPlayersAllowed = 2;
let players, numPlayers;
let myID, turn;
let chat, chat_max = 4;

database_players.on("value", (snapshot) => {
    players = snapshot.val();
    
    if (players) {
        numPlayers = players.filter(p => p !== -1).length;

        if (turn === null && numPlayers === numPlayersAllowed) {
            database_turn.set(0);

        } else if (numPlayers < numPlayersAllowed) {
            database_turn.set(null);

            if (numPlayers === 0) {
                database_chat.set(null);
            }

        }
        
    } else {
        for (let i = 0; i < numPlayersAllowed; i++) {
            database_players.child(i).set(-1);
        }

    }

    refreshDisplay();
});

database_turn.on("value", (snapshot) => {
    turn = snapshot.val();

    refreshDisplay();
});

database_chat.on("value", (snapshot) => {
    chat = (snapshot.val()) ? snapshot.val() : [];

    $("#chatDisplay").html(chat.join(""));
});


$(document).ready(function() {
    displayPage(0);
    $("#playerName").focus();
    $("#playerName").on("keyup", event => {
        if (event.keyCode === 13) {
            addPlayer($("#playerName").val().trim());
        }
    });
    $("#button_submit").on("click", () => {
        addPlayer($("#playerName").val().trim());
    });
    $("#chatMessage").on("keyup", event => {
        if (event.keyCode === 13) {
            addMessage($("#chatMessage").val().trim());
        }
    });
});
function checkName(name) {
    return name.match(/^[a-z0-9]+$/i);
}
function addPlayer(name) {
    if (numPlayers >= numPlayersAllowed) {
        $("#playerName").focus();
        $("#errorMessage").html("<p>Sorry, 2 people are already playing the game. Please wait for the next round.</p>");
        return;
    }
    if (!checkName(name)) {
        $("#playerName").focus();
        $("#errorMessage").html("<p>Please enter your name (letters, numbers only).</p>");

        setInterval(() => $("#errorMessage").empty(), 3000);

        return;
    }
    const player = {
        "name"     : name,
        "choice"   : -1,
        "numWins"  : 0,
        "numLosses": 0
    };

    for (let i = 0; i < numPlayersAllowed; i++) {
        if (players[i] === -1) {
            myID = i;

            database_players.child(myID).set(player);
            database_players.child(myID).onDisconnect().set(-1);

            break;
        }
    }

    displayPage(1);
}

$("body").on("click", ".attacks", function() {
    database_players.child(`${turn}/choice`).set($(".attacks").index(this));
    if (turn === numPlayersAllowed - 1) {
        let p1 = players[0], p2 = players[1];
        if (p1.choice !== p2.choice) {
            if ((p1.choice + 2) % 3 === p2.choice) {
                database_players.child(`0/numWins`).set(p1.numWins + 1);
                database_players.child(`1/numLosses`).set(p2.numLosses + 1);
            } else {
                database_players.child(`0/numLosses`).set(p1.numLosses + 1);
                database_players.child(`1/numWins`).set(p2.numWins + 1);

            }
        }
    }

    database_turn.set((turn + 1) % numPlayersAllowed);
});

function addMessage(message) {
    $("#chatMessage").val("");
    $("#chatMessage").focus();

    if (chat.length === chat_max) {
        chat.shift();
    }
    chat.push(`<p>${players[myID].name}: ${message}</p>`);

    database_chat.set(chat);
}


function displayPage(page) {
    $(".page").css({"display": "none"});
    $(`.page:nth-of-type(${page + 1})`).css({"display": "block"});
}

function refreshDisplay() {
    if (typeof myID !== "number") {
        return;
    }

    if (turn === null) {
        for (let i = 0; i < numPlayersAllowed; i++) {
            $(`#player${i} > .name`).html((players[i] !== -1) ? `<h2>${players[i].name}</h2>` : `<h2>Searching for Player ${i + 1}</h2>`);
            $(`#player${i} > .stats`).html((players[i] !== -1) ? `<p>Wins: ${players[i].numWins}, Losses: ${players[i].numLosses}</p>` : "");
            $(`#player${i} > .display`).empty();
        }
    } else {
        for (let i = 0; i < numPlayersAllowed; i++) {
            $(`#player${i} > .name`).html(`<h2>${players[i].name}</h2>`);
            $(`#player${i} > .stats`).html(`<p>Wins: ${players[i].numWins}, Losses: ${players[i].numLosses}</p>`);
        }

        $(`#player${myID} > .display`).html((turn === myID) ? 
                                            `<div class="attacks">Rock</div><div class="attacks">Paper</div><div class="attacks">Scissors</div>` :
                                            `<p>Searching for ${players[turn].name} to make a move.<p>`);
    }
}