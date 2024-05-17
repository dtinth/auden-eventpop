import * as admin from "firebase-admin";
import "google-application-credentials-base64";
import * as jwt from "jsonwebtoken";

admin.initializeApp();

export default async function (req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const idToken = String(req.body.idToken);
  try {
    const result = jwt.verify(
      idToken,
      `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8GO2/OpcRMCJ150DyObi
QkN54M1ACoDN+CyRzCuY4o3yFPYfIFnhwTFX622SIDrqv9HDoIKwT1XitIsToyBH
sSfET/iukcHhqjQnowdQAvxmgK4gSDxipHcbBd1c2Qfjwfkfj4X3CfR9ronA1HYe
2vICBpwcyiJTyicljuyq1kvFWG7S24iugh0DJ9wuHo/rF3gmWlU9/5TTMKR+GLxI
nRAFIpN5DfdVYbj6foLelq2r8KdMtQZzzt6nBR7RcraPSuidHWKkYR8KJrTmZn4z
JW6iZD9S9gdyfRQZMXu1TMYq7B9D25EE8lceY/c5KSVSvKcrvIcqTJu02T+iOrat
swIDAQAB
-----END PUBLIC KEY-----`,
      { algorithms: ["RS256"] }
    ) as any;
    if (!result.ticketId) {
      throw new Error("No ticket ID!!!!!");
    }
    const uid = `eventpop-ticket-${result.ticketId}`;
    const displayName = result.firstname + " " + result.lastname;
    await admin
      .auth()
      .createUser({ uid, displayName })
      .catch((error) => {
        if (error?.errorInfo?.code === "auth/uid-already-exists") {
          return;
        }
        throw error;
      });
    const token = await admin.auth().createCustomToken(uid, {
      name: displayName,
      eventpop: {
        ticketId: result.ticketId,
        eventId: result.eventId,
        referenceCode: result.referenceCode,
      },
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
