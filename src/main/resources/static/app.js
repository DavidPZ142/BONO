

//local player data
var mycar=undefined;
var mycarxpos=10;
var mycarypos=10;


//competitors data
var loadedCars=[];
var carsCurrentXPositions=[];
var carsCurrentYPositions=[];

let canMove = false;


var stompClient = null;

movex = function(){
    if(canMove == true) {
        mycarxpos+=10;
        paintCars();
        stompClient.send("/topic/car"+mycar.number, {}, JSON.stringify({car:mycar.number,xpos:mycarxpos}));
        if(mycarxpos > 630){
            registerWinner()
            getWinner()

        }
    }
    else{
        alert("Aun no se han registrado 5 jugadores")
    }

};

init = function(){
    connectAndSubscribeToCompetitors();
    $('#manyPlayers').html("El juego arranca cuando haya 5 jugadores")
    $('#movebutton').html("Aun no se mueve xd")
}

changeMove = function (){
    canMove = true;
}




howManyCars = function (){
    $.get("races/25/participants",
        function (data) {
            loadedCars = data
            console.log(data.length)
            if (data.length == 5){
                loadCompetitorsFromServer()
                stompClient.send("/topic/canMove",{},true)
                $('#manyPlayers').html("Ya hay 5 jugadores")
                $('#movebutton').html("Move My CAR!!!")
            }
        })
}


registerWinner = function (){
    $.ajax({
        url:"races/25/winner",
        type:'PUT',
        data: JSON.stringify(mycar),
        contentType: "application/json"
    }).then(
        function (){
            console.log("Has ganado")
        },
        function (err){
            alert("Ya hay winner")
        }
    )
}

getWinner = function () {

    $.get("races/25/winner",
        function (data){

        stompClient.send('/topic/winner',{},data)

        })
}


initAndRegisterInServer = function(){
    mycar={number:$("#playerid").val()};
    mycarxpos=10;
    mycarypos=10;
    
    $.ajax({
        url: "races/25/participants",
        type: 'PUT',
        data: JSON.stringify(mycar),
        contentType: "application/json"
    }).then(
            function(){                
                alert("Competitor registered successfully!");
                paintCars();
                howManyCars();
                stompClient.send("/topic/sala", {}, 1)
            },
            function(err){
                alert("err:"+err.responseText);

            }
    );


};

loadCompetitorsFromServer = function () {
    if (mycar == undefined) {
        alert('Register your car first!');
    } else {
        $.get("races/25/participants",
                function (data) {
                    loadedCars = data;
                    var carCount = 1;
                    //alert("Competitors loaded!");
                    loadedCars.forEach(
                            function (car) {
                                if (car.number != mycar.number) {
                                    carsCurrentXPositions[car.number] = 10;
                                    carsCurrentYPositions[car.number] = 40 * carCount;
                                    carCount++;
                                }
                            }
                    );
                    paintCars();
                    connectAndSubscribeToCompetitors();
                }
        );
    }

};

setWinner = function (data){
    alert("winner" + data)
    $('#winner').html(data)
}

function connectAndSubscribeToCompetitors() {
    var socket = new SockJS('/stompendpoint');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);

        loadedCars.forEach(

                function (car) {
                    //don't load my own car
                    if (car.number!=mycar.number){
                        stompClient.subscribe('/topic/car'+car.number, function (data) {
                            msgdata=JSON.parse(data.body);
                            carsCurrentXPositions[msgdata.car]=msgdata.xpos;
                            paintCars();
                        });
                    }
                }
        );

        stompClient.subscribe("/topic/sala",function (data){
            howManyCars();
        })
        stompClient.subscribe("/topic/canMove",function (data){
             changeMove();
        })
        stompClient.subscribe("/topic/winner",function (data) {

            setWinner(data.body);

        })


        
    });
}

function disconnect() {
    if (stompClient != null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");
}

paintCars=function(){
    canvas=$("#cnv")[0];
    ctx=canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //paint my car
    paint(mycar,mycarxpos,mycarypos,ctx);
    
    //paint competitors cars
    loadedCars.forEach(
            function(car){
                paint(car,carsCurrentXPositions[car.number],carsCurrentYPositions[car.number],ctx);
            }
    );
};


paint=function(car,xposition,yposition,ctx){
    
    var img = new Image;
    img.src = "img/car.png";
    img.onload = function(){        
        ctx.drawImage(img,xposition,yposition); 
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText(""+car.number, xposition+(img.naturalWidth/2), yposition+(img.naturalHeight/2));        
    };    
};



$(document).ready(
        
        function () {
            console.info('loading script!...');
            $(".controls").prop('disabled', false);    
            $("#racenum").prop('disabled', true);    
        }
);

