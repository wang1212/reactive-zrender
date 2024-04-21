/**
 * Generates a unique identifier.
 * @returns {string} The generated unique identifier.
 */
export function generateUID() {
  // Define the characters used for the identifier.
  const characters = '0123456789abcdef';

  // Define a function to get a random character from the characters string.
  const getRandomCharacter = () => characters[Math.floor(Math.random() * characters.length)];

  // Generate the parts of the unique identifier.
  const uidParts = [
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    '-',
    '4',
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    '-',
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    '-',
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter(),
    getRandomCharacter()
  ];

  // Join the uid parts together and return the generated unique identifier.
  return uidParts.join('');
}
