"use client";

import { useEffect, useState } from "react";

export default function PoweredByText() {
    const [poweredBy, setPoweredBy] = useState("");
    const [sindoutriqua, setSindoutriqua] = useState("");

    /* useEffect(() => {
        setTimeout(() => {
            setSindoutriqua("sindoutriqua");
            setPoweredBy("Powered by");
        }, 1000);
    }, []); */

    return <>
        {/* <span className="text-default-600">{poweredBy}</span>
        <p className="text-primary">{sindoutriqua}</p> */}
    </>;
}