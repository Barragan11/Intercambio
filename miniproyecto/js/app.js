// =============================
// CAMBIO DE SECCIONES (SPA)
// =============================
function mostrarSeccion(id){
    document.querySelectorAll('.section')
        .forEach(sec => sec.classList.remove('active-section'));

    document.getElementById(id)
        .classList.add('active-section');
}

// =============================
// VARIABLES GLOBALES
// =============================
let participantes = [];
let exclusiones = {};

// =============================
// MOSTRAR CAMPOS DINÁMICOS
// =============================
function mostrarPersonalizado(){
    const tipo = document.getElementById("tipoEvento").value;
    const div = document.getElementById("nombreCelebracionDiv");

    if(tipo === "personalizado"){
        div.classList.remove("d-none");
    }else{
        div.classList.add("d-none");
    }
}

function mostrarOtroMonto(){
    const presupuesto = document.getElementById("presupuesto").value;
    const div = document.getElementById("otroMontoDiv");

    if(presupuesto === "otro"){
        div.classList.remove("d-none");
    }else{
        div.classList.add("d-none");
    }
}

// =============================
// AGREGAR PARTICIPANTES
// =============================
function agregarParticipante(){
    const input = document.getElementById("participanteInput");
    const nombre = input.value.trim();

    if(nombre === ""){
        Swal.fire("Campo vacío","Ingresa un nombre","warning");
        return;
    }

    if(participantes.includes(nombre)){
        Swal.fire("Duplicado","Ese participante ya existe","error");
        return;
    }

    participantes.push(nombre);
    exclusiones[nombre] = [];
    input.value = "";

    renderLista();
    renderExclusiones();
}

// =============================
// RENDER LISTA (Drag & Drop)
// =============================
function renderLista(){
    const lista = document.getElementById("listaParticipantes");
    lista.innerHTML = "";

    participantes.forEach(p=>{
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.draggable = true;
        li.textContent = p;

        li.addEventListener("dragstart",()=>li.classList.add("dragging"));
        li.addEventListener("dragend",()=>{
            li.classList.remove("dragging");
            actualizarOrden();
        });

        lista.appendChild(li);
    });
}

document.addEventListener("dragover",e=>{
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const lista = document.getElementById("listaParticipantes");
    if(!dragging) return;

    const afterElement = getDragAfterElement(lista,e.clientY);

    if(afterElement == null){
        lista.appendChild(dragging);
    }else{
        lista.insertBefore(dragging,afterElement);
    }
});

function getDragAfterElement(container,y){
    const elements=[...container.querySelectorAll(".list-group-item:not(.dragging)")];

    return elements.reduce((closest,child)=>{
        const box=child.getBoundingClientRect();
        const offset=y-box.top-box.height/2;
        if(offset<0 && offset>closest.offset){
            return{offset:offset,element:child};
        }else{
            return closest;
        }
    },{offset:Number.NEGATIVE_INFINITY}).element;
}

function actualizarOrden(){
    const items=document.querySelectorAll("#listaParticipantes li");
    participantes=[...items].map(item=>item.textContent);
}

// =============================
// EXCLUSIONES DINÁMICAS
// =============================
function renderExclusiones(){
    const container = document.getElementById("exclusionesContainer");
    container.innerHTML = "";

    participantes.forEach(persona=>{
        let html = `<div class="mb-3">
        <strong>${persona} no puede regalar a:</strong><br>`;

        participantes.forEach(posible=>{
            if(persona !== posible){
                html += `
                <div class="form-check form-check-inline">
                    <input class="form-check-input"
                        type="checkbox"
                        onchange="toggleExclusion('${persona}','${posible}')">
                    <label class="form-check-label">${posible}</label>
                </div>`;
            }
        });

        html += `</div><hr>`;
        container.innerHTML += html;
    });
}

function toggleExclusion(persona,excluido){
    if(exclusiones[persona].includes(excluido)){
        exclusiones[persona] =
            exclusiones[persona].filter(p=>p!==excluido);
    }else{
        exclusiones[persona].push(excluido);
    }
}

// =============================
// GUARDAR EVENTO
// =============================
function guardarEvento(){

    const organizador = document.getElementById("organizador").value;
    const tipoEvento = document.getElementById("tipoEvento").value;
    const nombreCelebracion = document.getElementById("nombreCelebracion").value;
    const fecha = document.getElementById("fecha").value;
    let presupuesto = document.getElementById("presupuesto").value;

    if(presupuesto === "otro"){
        presupuesto = document.getElementById("montoPersonalizado").value;
    }

    if(!organizador || !fecha || participantes.length < 2){
        Swal.fire("Error","Completa todos los campos y agrega mínimo 2 participantes","error");
        return;
    }

    const evento = {
        organizador,
        tipoEvento,
        nombreCelebracion,
        fecha,
        presupuesto,
        participantes,
        exclusiones
    };

    localStorage.setItem("eventoJerseySwap",JSON.stringify(evento));

    Swal.fire("Guardado","Evento guardado correctamente","success");
}

// =============================
// IR A RESUMEN
// =============================
function irAlResumen(){

    const eventoGuardado = localStorage.getItem("eventoJerseySwap");

    if(!eventoGuardado){
        Swal.fire("Evento no guardado","Primero guarda el evento","warning");
        return;
    }

    mostrarResumen();
    mostrarSeccion("resumen");
}

// =============================
// MOSTRAR RESUMEN DESDE LOCALSTORAGE
// =============================
function mostrarResumen(){

    const evento = JSON.parse(localStorage.getItem("eventoJerseySwap"));
    const div = document.getElementById("datosEvento");

    let html = `
    <p><strong>Organizador:</strong> ${evento.organizador}</p>
    <p><strong>Tipo Evento:</strong> ${evento.tipoEvento}</p>
    <p><strong>Celebración:</strong> ${evento.nombreCelebracion || "N/A"}</p>
    <p><strong>Fecha:</strong> ${evento.fecha}</p>
    <p><strong>Presupuesto:</strong> $${evento.presupuesto}</p>

    <h5>Participantes:</h5>
    <ul>`;

    evento.participantes.forEach(p=>{
        html += `<li>${p}</li>`;
    });

    html += `</ul><h5>Exclusiones:</h5>`;

    for(let persona in evento.exclusiones){
        if(evento.exclusiones[persona].length > 0){
            html += `<p>${persona} no regala a: ${evento.exclusiones[persona].join(", ")}</p>`;
        }
    }

    div.innerHTML = html;
}

// =============================
// SORTEO RESPETANDO EXCLUSIONES
// =============================
function realizarSorteo(){

    const evento = JSON.parse(localStorage.getItem("eventoJerseySwap"));

    if(!evento){
        Swal.fire("Error","No hay evento guardado","error");
        return;
    }

    let participantes = [...evento.participantes];
    let disponibles = [...participantes];
    let resultados = {};

    for(let persona of participantes){

        let posibles = disponibles.filter(p =>
            p !== persona &&
            !evento.exclusiones[persona].includes(p)
        );

        if(posibles.length === 0){
            Swal.fire("Error",
            "No se puede realizar el sorteo con estas exclusiones",
            "error");
            return;
        }

        let elegido =
            posibles[Math.floor(Math.random()*posibles.length)];

        resultados[persona] = elegido;
        disponibles = disponibles.filter(p=>p!==elegido);
    }

    localStorage.setItem("resultadosJerseySwap",
        JSON.stringify(resultados));

    mostrarResultados(resultados);

    Swal.fire("Sorteo listo",
    "El intercambio se realizó correctamente",
    "success");
}

function mostrarResultados(resultados){

    const contenedor = document.getElementById("resultados");
    contenedor.innerHTML = "";

    for(let persona in resultados){
        contenedor.innerHTML += `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="result-card text-center">
                <h5>${persona}</h5>
                <p class="fw-bold text-danger"> Intercambia con:</p>
                <h4>${resultados[persona]}</h4>
            </div>
        </div>`;
    }
}

// =============================
// LIMPIAR TODO EL SISTEMA
// =============================
function limpiarSistema(){

    Swal.fire({
        title: "¿Reiniciar evento?",
        text: "Se borrará toda la información guardada",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, reiniciar",
        cancelButtonText: "Cancelar"
    }).then((result)=>{

        if(result.isConfirmed){

            // Borrar localStorage
            localStorage.removeItem("eventoJerseySwap");
            localStorage.removeItem("resultadosJerseySwap");

            // Vaciar variables
            participantes = [];
            exclusiones = {};

            // Limpiar listas visuales
            document.getElementById("listaParticipantes").innerHTML = "";
            document.getElementById("exclusionesContainer").innerHTML = "";
            document.getElementById("resultados").innerHTML = "";

            // Limpiar inputs
            document.querySelectorAll("input").forEach(input=>{
                input.value = "";
            });

            document.querySelectorAll("select").forEach(select=>{
                select.selectedIndex = 0;
            });

            mostrarSeccion("inicio");

            Swal.fire("Reiniciado","Sistema limpio correctamente","success");
        }
    });

}
