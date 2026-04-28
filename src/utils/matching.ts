export function calculateNameMatchScore(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s1 = normalize(name1);
  const s2 = normalize(name2);
  
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 85; 

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  
  if (maxLength === 0) return 0;
  
  const score = ((maxLength - distance) / maxLength) * 100;
  return Math.round(score * 100) / 100; // Round to 2 decimals
}

export function calculateDobMatch(dob1: Date | string | null | undefined, dob2: Date | string | null | undefined): boolean {
  if (!dob1 || !dob2) return false;
  
  const d1 = new Date(dob1).toISOString().split('T')[0];
  const d2 = new Date(dob2).toISOString().split('T')[0];
  
  return d1 === d2;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
