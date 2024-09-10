var series = "";

for(var i=0;i<=69;i++){
    series+= `<div class="circle">${Math.floor(Math.random()*10)}</div>`;
}

document.querySelector("#B2").innerHTML = series;