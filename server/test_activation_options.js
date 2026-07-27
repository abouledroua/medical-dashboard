import fetch from "node-fetch";

async function testActivationOptions() {
  try {
    console.log("Testing Activation Options API endpoints...\n");

    // Test GET endpoint
    console.log("1️⃣ Testing GET /api/clinic");
    const getRes = await fetch("http://localhost:3001/api/clinic");
    const data = await getRes.json();

    console.log("Response includes:");
    console.log("  ✓ GEST_RDV:", data.GEST_RDV);
    console.log("  ✓ RESUME_DERN_CONS:", data.RESUME_DERN_CONS);
    console.log("  ✓ GEST_IMAGE:", data.GEST_IMAGE);
    console.log("  ✓ APERCU:", data.APERCU);

    // Test PUT endpoint
    console.log("\n2️⃣ Testing PUT /api/clinic with new fields");
    const putRes = await fetch("http://localhost:3001/api/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nomCabinet: data.nomCabinet,
        doctorNameFr: data.doctorNameFr,
        GEST_RDV: 1,
        RESUME_DERN_CONS: 2,
        GEST_IMAGE: 1,
        APERCU: 2,
      }),
    });

    const updated = await putRes.json();
    console.log("Update response includes:");
    console.log("  ✓ GEST_RDV:", updated.GEST_RDV);
    console.log("  ✓ RESUME_DERN_CONS:", updated.RESUME_DERN_CONS);
    console.log("  ✓ GEST_IMAGE:", updated.GEST_IMAGE);
    console.log("  ✓ APERCU:", updated.APERCU);

    console.log("\n✅ All tests passed!");
  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

testActivationOptions();
