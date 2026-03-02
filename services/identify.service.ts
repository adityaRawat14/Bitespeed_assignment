import { pool } from "../db";



export const identifyContact = async (
  email?: string,
  phoneNumber?: string
) => {
  const client = await pool.connect();

  try {
    // start transaction
    await client.query("BEGIN");

    if (!email && !phoneNumber) {
      throw new Error("Email or phoneNumber required");
    }

   // check which row contact matches
    const { rows: matched } = await client.query(
      `
      SELECT * FROM "Contact"
      WHERE email = $1 OR "phoneNumber" = $2
      AND "deletedAt" IS NULL
      ORDER BY "createdAt" ASC
      `,
      [email || null, phoneNumber || null]
    );

    //  if no contact exists then  create a new as "primary"
    if (matched.length === 0) {
      const { rows } = await client.query(
        `
        INSERT INTO "Contact"
        (email, "phoneNumber", "linkPrecedence")
        VALUES ($1,$2,'primary')
        RETURNING *
        `,
        [email || null, phoneNumber || null]
      );

      await client.query("COMMIT");
      return buildResponse([rows[0]]);
    }

    // 3️⃣ Get all related contacts (full chain)
    const primaryIds = new Set<number>();

    matched.forEach((c) => {
      if (c.linkPrecedence === "primary") primaryIds.add(c.id);
      else primaryIds.add(c.linkedId);
    });

    const { rows: related } = await client.query(
      `
      SELECT * FROM "Contact"
      WHERE id = ANY($1) OR "linkedId" = ANY($1)
      ORDER BY "createdAt" ASC
      `,
      [Array.from(primaryIds)]
    );

    // 4️ Find oldest primary
    const primaries = related.filter((c) => c.linkPrecedence === "primary");
    const primary = primaries.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];

    //  Convert other primaries to secondary (MERGING LOGIC)
    for (const p of primaries) {
      if (p.id !== primary.id) {
        await client.query(
          `
          UPDATE "Contact"
          SET "linkPrecedence"='secondary',
              "linkedId"=$1,
              "updatedAt"=NOW()
          WHERE id=$2
          `,
          [primary.id, p.id]
        );
      }
    }

    // Create secondary if new info present
    const emailExists = related.some((c) => c.email === email);
    const phoneExists = related.some((c) => c.phoneNumber === phoneNumber);

    if (!emailExists || !phoneExists) {
      await client.query(
        `
        INSERT INTO "Contact"
        (email,"phoneNumber","linkedId","linkPrecedence")
        VALUES ($1,$2,$3,'secondary')
        `,
        [email || null, phoneNumber || null, primary.id]
      );
    }

    //  Fetch updated full group
    const { rows: finalContacts } = await client.query(
      `
      SELECT * FROM "Contact"
      WHERE id=$1 OR "linkedId"=$1
      ORDER BY "createdAt" ASC
      `,
      [primary.id]
    );

    await client.query("COMMIT");
    return buildResponse(finalContacts);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const buildResponse = (contacts: any[]) => {
  const primary = contacts.find((c) => c.linkPrecedence === "primary");

  return {
    contact: {
      primaryContatctId: primary.id,
      emails: [...new Set(contacts.map((c) => c.email).filter(Boolean))],
      phoneNumbers: [
        ...new Set(contacts.map((c) => c.phoneNumber).filter(Boolean)),
      ],
      secondaryContactIds: contacts
        .filter((c) => c.linkPrecedence === "secondary")
        .map((c) => c.id),
    },
  };
};