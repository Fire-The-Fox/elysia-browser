// @ts-nocheck document missing baka!
import { edenFetch } from '@elysiajs/eden'
import { Mewo } from "@mewo-js/core"

let eden = null;
let routes = [];

function connect() {
    if (eden) return;
    const text = document.querySelector("input");
    eden = edenFetch(text.value);
    const socket = new WebSocket("ws" + text.value.replace(/http.*?(?=:)/, "") + "/elysia-connector")
    socket.onmessage = (event) => {
        routes = JSON.parse(event.data)
        socket.close();
        prepare();
    }
}

function prepare() {
    const text = document.querySelector("h2");
    text.innerText = "Connected";
    routes = routes.sort((a, b) => a.route.localeCompare(b.route));

    const appendor = document.querySelector(".routes");

    for (const i of routes) {
        const main = document.createElement("div");
        const method = document.createElement("p");
        const route = document.createElement("p");
        method.innerText = i.method;
        route.innerText = i.route;
        main.appendChild(method);
        main.appendChild(route);
        main.onclick = () => setupRequest(i);
        appendor.appendChild(main);
    }
}

function getParams(route) {
    const matches = route.match(/:.+?(?=\/|$)/g)
    const out = [];
    if (!matches) return out;
    for (const match of matches) {
        out.push(match);
    }

    return out;
}

async function makeRequest(routeData: any, params: []) {
    const prms = {};
    if (params.includes(undefined)) return;
    params.forEach(p => {
        prms[p.n.slice(1)] = p.v
    });
    const data = await eden(routeData.route, {
        method: routeData.method,
        params: prms
    });

    return data;
}

async function setupRequest(i: any) {
    const params = getParams(i.route);
    const comp = document.querySelector(".input");
    comp.innerHTML = "";
    const title = document.createElement("h3");
    title.innerText = `Route: ${i.route}`;
    comp.appendChild(title);

    let paramComp = null;
    const refs = new Array(params.length);

    if (params.length > 0) {
        paramComp = Mewo("div", true, comp).css({
            display: "flex",
            flexDirection: "column"
        }).mount()
        Mewo("strong", true, paramComp).text("Params")
        .css({ fontSize: "large" }).mount()
    }

    for (const param in params) {
        Mewo("p", true, paramComp).text(params[param].slice(1) + ":")
        .css({ fontSize: "large", margin: 0 }).mount();
        const v = Mewo("input", true, paramComp);
        v.attr("type", "text");
        v.on("keyup", () => {
            refs[param] = { 
                v: v.value(),
                n: params[param]
            }
        })
        v.mount();
    }
    Mewo("strong", true, comp).text(`Body: ${i.method == "GET" ? "disabled for method GET" : ""}`)
    .mount().css({ fontSize: "large"})
    Mewo("div", true, comp).css({ padding: "1px" }).mount()
    Mewo("textarea", true, comp).mount().attr("disabled", i.method == "GET");
    let text;
    Mewo("button", true, comp).mount().on("click", async () => {
        text.text(JSON.stringify(await makeRequest(i, refs), null, 4));
    }).text("Submit")
    Mewo("div", true, comp).css({ padding: "1px" }).mount()
    text = Mewo("pre", true, comp).mount();
}

document.querySelector("button").onclick = connect;
