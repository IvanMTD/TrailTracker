function parseOSMData(xmlData) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "text/xml");
    const ways = xmlDoc.getElementsByTagName("way");
    const nodes = xmlDoc.getElementsByTagName("node");
    const relations = xmlDoc.getElementsByTagName("relation");
    const nodeMap = new Map();

    // —оздаем карту узлов дл€ быстрого доступа к координатам по ref
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const id = node.getAttribute("id");
        const lat = parseFloat(node.getAttribute("lat"));
        const lon = parseFloat(node.getAttribute("lon"));
        nodeMap.set(id, [lat, lon]);
    }

    const wayMap = new Map();

    // —оздаем карту ways дл€ быстрого доступа по ref
    for (let i = 0; i < ways.length; i++) {
        const way = ways[i];
        const nds = way.getElementsByTagName("nd");
        const coordinates = [];

        for (let k = 0; k < nds.length; k++) {
            const ref = nds[k].getAttribute("ref");
            if (nodeMap.has(ref)) {
                coordinates.push(nodeMap.get(ref));
            }
        }

        wayMap.set(way.getAttribute("id"), coordinates);
    }

    const parkBoundaries = [];

    for (let i = 0; i < relations.length; i++) {
        const relation = relations[i];
        const tags = relation.getElementsByTagName("tag");
        const members = relation.getElementsByTagName("member");

        let isParkBoundary = false;
        let relationName = '';

        // ѕровер€ем теги на наличие меток, указывающих на границы парка
        for (let j = 0; j < tags.length; j++) {
            const tag = tags[j];
            const key = tag.getAttribute("k");
            const value = tag.getAttribute("v");

            if (key === "boundary" && value === "national_park") {
                isParkBoundary = true;
            } else if (key === "name") {
                relationName = value;
            }
        }

        // ≈сли это граница парка Ќалычево, извлекаем координаты
        if (isParkBoundary) { // && relationName.includes("Ќалычево")
            console.log(relationName);
            const coordinates = [];

            for (let k = 0; k < members.length; k++) {
                const member = members[k];
                if (member.getAttribute("type") === "way") {
                    const ref = member.getAttribute("ref");
                    if (wayMap.has(ref)) {
                        coordinates.push(...wayMap.get(ref));
                    }
                }
            }

            parkBoundaries.push(coordinates);
        }
    }

    return parkBoundaries;
}