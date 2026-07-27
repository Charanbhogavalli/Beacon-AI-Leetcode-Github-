console.log("🚀 Beacon AI Loaded!");

createBeaconButton();

function createBeaconButton() {

    const button = document.createElement("button");

    button.innerText = "🟢 Beacon";

    button.id = "beacon-btn";
    button.addEventListener("click",()=>{

     openSidebar();

});

    document.body.appendChild(button);

}
function openSidebar(){
    if (document.getElementById("beacon-sidebar")) return;
    const sidebar=document.createElement("div");
    const path=window.location.pathname;
    
let pagetype="home";

if(path.includes("/issues")){

    pagetype="issues";
     
}
else if(path.includes("/pulls")){
    pagetype="pull";
     

}
else{
   let parts=path.split("/").filter(Boolean);
   if(parts.length===2){
    pagetype="repositories";
   }
    

}
    sidebar.id="beacon-sidebar";

     sidebar.innerHTML = `
    <h2>🟢 Beacon AI</h2>
    <button id="explainBtn">
    ✨ Explain Issue
    </button>
    <button id="summarizeBtn">
    📝 Summarize Discussion
    </button>
    <button>
    📚 Learn Concepts
    </button>
    <div id="response"></div>



`;
   

    document.body.appendChild(sidebar);
    const explainBtn=document.getElementById("explainBtn");
   explainBtn.addEventListener("click",()=>{
     const title=document.querySelector("bdi").innerText;
     const description=document.querySelector(".markdown-body").innerText;
     console.log(title);
     console.log(description);
     const response=document.getElementById("response");
     response.innerHTML= `
        <h3>${title}</h3>
        <p>${description}</p>
    `;
   });

}