const RACA_URL = "https://raw.githubusercontent.com/kennyangit/projeto-bef-pandas/refs/heads/main/data/candidaturas_raca_por_uf.csv";
const GENERO_URL = "https://raw.githubusercontent.com/kennyangit/projeto-bef-pandas/refs/heads/main/data/candidaturas_genero_por_uf.csv";

const COR = { BRANCA: "#4e79a7", PARDA: "#f28e2b", PRETA: "#59a14f", "INDÍGENA": "#e15759" };
const COR_GENERO = { MASCULINO: "#4e79a7", FEMININO: "#f28e2b" };

const REGIOES = {
    AC: "Norte", AM: "Norte", AP: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte",
    AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste",
    PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
    DF: "Centro-Oeste", GO: "Centro-Oeste", MS: "Centro-Oeste", MT: "Centro-Oeste",
    ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste",
    PR: "Sul", RS: "Sul", SC: "Sul"
};

const VEGACONFIG = {
    background: "transparent",
    font: "Arial",
    axis: {
        gridColor: "rgba(255,255,255,0.05)",
        domainColor: "rgba(255,255,255,0.12)",
        tickColor: "rgba(255,255,255,0.12)",
        labelColor: "#8a8fa0",
        titleColor: "#9a9fb2",
        labelFontSize: 11,
        titleFontSize: 11,
        titleFont: "Arial",
        labelFont: "Arial",
        titleFontWeight: 500
    },
    legend: {
        labelColor: "#8a8fa0",
        titleColor: "#9a9fb2",
        labelFontSize: 11,
        titleFontSize: 11,
        titleFont: "Arial",
        labelFont: "Arial",
        titleFontWeight: 500
    },
    title: { color: "#f0ede8", fontSize: 13, fontWeight: 600, font: "Arial" },
    view: { stroke: "transparent" },
    autosize: { type: "fit", contains: "padding" }
};

function embed(id, spec) {
    document.getElementById(id).innerHTML = "";
    vegaEmbed("#" + id, spec, {
        config: VEGACONFIG,
        actions: { export: true, source: false, compiled: false, editor: false },
        renderer: "svg",
        theme: "dark"
    });
}

async function init() {
    const [raca, genero] = await Promise.all([
        d3.csv(RACA_URL, d3.autoType),
        d3.csv(GENERO_URL, d3.autoType)
    ]);

    /* ── G1: Barras — total nacional por raça ── */
    const racas = ["BRANCA", "PARDA", "PRETA", "INDÍGENA"];
    const g1data = racas.map(r => ({ raca: r, total: d3.sum(raca, d => d[r]) }));
    embed("chart1", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g1data },
        mark: { type: "bar", cornerRadiusTopLeft: 5, cornerRadiusTopRight: 5 },
        encoding: {
            x: { field: "raca", type: "nominal", title: "Raça/Cor", sort: "-y", axis: { labelAngle: 0 } },
            y: { field: "total", type: "quantitative", title: "Total de candidaturas" },
            color: { field: "raca", type: "nominal", scale: { domain: racas, range: Object.values(COR) }, legend: { title: "Raça/Cor" } },
            tooltip: [{ field: "raca", title: "Raça/Cor" }, { field: "total", title: "Total", format: "," }]
        },
        width: 680, height: 400
    });

    /* ── G2: Donut — proporção gênero ── */
    const g2data = [
        { genero: "MASCULINO", total: d3.sum(genero, d => d.MASCULINO) },
        { genero: "FEMININO", total: d3.sum(genero, d => d.FEMININO) }
    ];
    embed("chart2", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g2data },
        mark: { type: "arc", innerRadius: 90 },
        encoding: {
            theta: { field: "total", type: "quantitative" },
            color: { field: "genero", type: "nominal", scale: { domain: ["MASCULINO", "FEMININO"], range: [COR_GENERO.MASCULINO, COR_GENERO.FEMININO] }, legend: { title: "Gênero" } },
            tooltip: [{ field: "genero", title: "Gênero" }, { field: "total", title: "Total", format: "," }]
        },
        width: 380, height: 380
    });

    /* ── G3: Barras horizontais — ranking feminino ── */
    const g3data = genero.map(d => ({ uf: d.sigla_uf, feminino: d.FEMININO }))
        .sort((a, b) => b.feminino - a.feminino);
    embed("chart3", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g3data },
        mark: { type: "bar", color: COR_GENERO.FEMININO, cornerRadiusTopRight: 5, cornerRadiusBottomRight: 5 },
        encoding: {
            y: { field: "uf", type: "nominal", title: "Estado", sort: "-x" },
            x: { field: "feminino", type: "quantitative", title: "Candidaturas femininas" },
            tooltip: [{ field: "uf", title: "Estado" }, { field: "feminino", title: "Feminino", format: "," }]
        },
        width: 680, height: 600
    });

    /* ── G4: Barras agrupadas — gênero por região ── */
    const porRegiao = [];
    for (const d of genero) {
        const reg = REGIOES[d.sigla_uf] || "Outro";
        porRegiao.push({ regiao: reg, genero: "MASCULINO", total: d.MASCULINO });
        porRegiao.push({ regiao: reg, genero: "FEMININO", total: d.FEMININO });
    }
    const g4data = d3.rollups(porRegiao, v => d3.sum(v, d => d.total), d => d.regiao, d => d.genero)
        .flatMap(([reg, gens]) => gens.map(([gen, tot]) => ({ regiao: reg, genero: gen, total: tot })));
    embed("chart4", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g4data },
        mark: { type: "bar", cornerRadiusTopLeft: 4, cornerRadiusTopRight: 4 },
        encoding: {
            x: { field: "regiao", type: "nominal", title: "Região", axis: { labelAngle: 0 } },
            xOffset: { field: "genero", type: "nominal" },
            y: { field: "total", type: "quantitative", title: "Total de candidaturas" },
            color: { field: "genero", type: "nominal", scale: { domain: ["MASCULINO", "FEMININO"], range: [COR_GENERO.MASCULINO, COR_GENERO.FEMININO] }, legend: { title: "Gênero" } },
            tooltip: [{ field: "regiao", title: "Região" }, { field: "genero", title: "Gênero" }, { field: "total", title: "Total", format: "," }]
        },
        width: 680, height: 400
    });

    /* ── G5: 100% empilhadas — proporção gênero por UF ── */
    const g5data = [];
    for (const d of genero) {
        const tot = d.FEMININO + d.MASCULINO;
        g5data.push({ uf: d.sigla_uf, genero: "FEMININO", prop: d.FEMININO / tot });
        g5data.push({ uf: d.sigla_uf, genero: "MASCULINO", prop: d.MASCULINO / tot });
    }
    const g5order = genero.map(d => ({ uf: d.sigla_uf, pf: d.FEMININO / (d.FEMININO + d.MASCULINO) }))
        .sort((a, b) => b.pf - a.pf).map(d => d.uf);
    embed("chart5", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g5data },
        mark: "bar",
        encoding: {
            x: { field: "uf", type: "nominal", title: "Estado", sort: g5order, axis: { labelAngle: -45 } },
            y: { field: "prop", type: "quantitative", stack: "normalize", title: "Proporção", axis: { format: "%" } },
            color: { field: "genero", type: "nominal", scale: { domain: ["FEMININO", "MASCULINO"], range: [COR_GENERO.FEMININO, COR_GENERO.MASCULINO] }, legend: { title: "Gênero" } },
            tooltip: [{ field: "uf", title: "Estado" }, { field: "genero", title: "Gênero" }, { field: "prop", title: "Proporção", format: ".1%" }]
        },
        width: 680, height: 400
    });

    /* ── G6: Barras empilhadas — raça por UF absoluto ── */
    const g6data = raca.flatMap(d => racas.map(r => ({ uf: d.sigla_uf, cor: r, total: d[r] })));
    embed("chart6", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g6data },
        mark: "bar",
        encoding: {
            x: { field: "uf", type: "nominal", title: "Estado", axis: { labelAngle: -45 } },
            y: { field: "total", type: "quantitative", stack: true, title: "Total de candidaturas" },
            color: { field: "cor", type: "nominal", scale: { domain: racas, range: Object.values(COR) }, legend: { title: "Raça/Cor" } },
            tooltip: [{ field: "uf", title: "Estado" }, { field: "cor", title: "Raça/Cor" }, { field: "total", title: "Total", format: "," }]
        },
        width: 680, height: 420
    });

    /* ── G7: 100% empilhadas — proporção raça por UF ── */
    const g7data = raca.flatMap(d => {
        const tot = racas.reduce((s, r) => s + d[r], 0);
        return racas.map(r => ({ uf: d.sigla_uf, cor: r, prop: d[r] / tot }));
    });
    const g7order = raca.map(d => {
        const tot = racas.reduce((s, r) => s + d[r], 0);
        return { uf: d.sigla_uf, pb: d.BRANCA / tot };
    }).sort((a, b) => b.pb - a.pb).map(d => d.uf);
    embed("chart7", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g7data },
        mark: "bar",
        encoding: {
            x: { field: "uf", type: "nominal", title: "Estado", sort: g7order, axis: { labelAngle: -45 } },
            y: { field: "prop", type: "quantitative", stack: "normalize", title: "Proporção", axis: { format: "%" } },
            color: { field: "cor", type: "nominal", scale: { domain: racas, range: Object.values(COR) }, legend: { title: "Raça/Cor" } },
            tooltip: [{ field: "uf", title: "Estado" }, { field: "prop", title: "Proporção", format: ".1%" }, { field: "cor", title: "Raça/Cor" }]
        },
        width: 680, height: 420
    });

    /* ── G8: Heatmap — indígenas por estado ── */
    const g8data = raca.map(d => ({ uf: d.sigla_uf, valor: d["INDÍGENA"] }))
        .sort((a, b) => b.valor - a.valor);
    const g8order = g8data.map(d => d.uf);
    embed("chart8", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: g8data },
        mark: { type: "rect", cornerRadius: 5 },
        encoding: {
            x: { field: "uf", type: "nominal", title: "Estado", sort: g8order, axis: { labelAngle: -45 } },
            color: { field: "valor", type: "quantitative", scale: { scheme: "orangered" }, legend: { title: "Candidaturas" } },
            tooltip: [{ field: "uf", title: "Estado" }, { field: "valor", title: "Candidaturas Indígenas" }]
        },
        width: 680, height: 130
    });

    /* ── G9: Dispersão — feminino × masculino ── */
    const g9data = genero.map(d => ({
        uf: d.sigla_uf,
        feminino: d.FEMININO,
        masculino: d.MASCULINO,
        regiao: REGIOES[d.sigla_uf] || "Outro"
    }));
    const maxVal = d3.max(g9data, d => d.masculino);
    const paridade = [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }];

    embed("chart9", {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        layer: [
            {
                data: { values: paridade },
                mark: { type: "line", color: "rgba(255,255,255,0.2)", strokeDash: [5, 4] },
                encoding: {
                    x: { field: "x", type: "quantitative" },
                    y: { field: "y", type: "quantitative" }
                }
            },
            {
                data: { values: g9data },
                mark: { type: "point", filled: true, size: 100, opacity: 0.85 },
                encoding: {
                    x: { field: "masculino", type: "quantitative", title: "Candidaturas masculinas" },
                    y: { field: "feminino", type: "quantitative", title: "Candidaturas femininas" },
                    color: { field: "regiao", type: "nominal", legend: { title: "Região" } },
                    tooltip: [
                        { field: "uf", title: "Estado" },
                        { field: "masculino", title: "Masculino", format: "," },
                        { field: "feminino", title: "Feminino", format: "," },
                        { field: "regiao", title: "Região" }
                    ]
                }
            }
        ],
        width: 680, height: 480
    });
}

init().then(() => {
    const fadeEls = document.querySelectorAll('.chart-block, .conclusion-list li, .cols-table');
    fadeEls.forEach(el => el.classList.add('fade-in'));
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.08 });
    fadeEls.forEach(el => observer.observe(el));
});