import "server-only"
import { createHash, randomInt } from "node:crypto"

// Alphabet sans I, O, 0, 1 : évite les confusions à l'oral ou à la lecture
// quand un code est communiqué par téléphone ou sur papier.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const PREFIXE = "RN05"

export function genererCode(): string {
  const groupe = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")
  return `${PREFIXE}-${groupe()}-${groupe()}`
}

// Majuscules, espaces et tirets supprimés : "rn05 1234 5678" et
// "RN05-1234-5678" doivent produire le même hash.
export function normaliserCode(saisie: string): string {
  return saisie.toUpperCase().replace(/[\s-]/g, "")
}

// SHA-256 (pas bcrypt) : l'empreinte doit être déterministe pour servir de
// clé de recherche indexée (code_hash unique) — un hash à sel aléatoire
// empêcherait de retrouver la ligne par simple égalité. Le poivre
// (SIGNUP_CODE_PEPPER, jamais stocké en base) compense la faible entropie
// d'un code court : sans lui, une fuite de la base ne suffit pas à
// retrouver les codes par dictionnaire.
export function hacherCode(saisie: string): string {
  const poivre = process.env.SIGNUP_CODE_PEPPER
  if (!poivre) {
    throw new Error("SIGNUP_CODE_PEPPER n'est pas configuré.")
  }
  return createHash("sha256")
    .update(`${poivre}:${normaliserCode(saisie)}`)
    .digest("hex")
}
