#!/usr/bin/env node

/**
 * Generates a large data-set suitable for checking scalability of case-(in)sensitive operations.
 * 
 * With default arguments:
 * - Generates 100K rows of data.
 * - Generates ~10K+ unique values for colourCode; which map to 11 distinct case-insensitive values.
 * 
 * Usage:
 * node grid-packages/ag-grid-docs/documentation/generate-colours.js >grid-packages/ag-grid-docs/documentation/static/large-colours.json
 * 
 * Optional arguments:
 * <number-of-rows> <colour-code-suffix-to-bump-permutations>
 */

const COLOURS = ['Black', 'Red', 'Orange', 'White', 'Yellow', 'Green', 'Purple', 'Brown', 'Coral', 'Blue', 'DeepPink', 'Indigo'];

let count = 0;
let iteration = 0;
const targetCount = Number(process.argv[1]) || 100000;
const permutationExtendedSuffix = process.argv[2] || ':ABCD';

console.error(`Generating ${targetCount} rows...`);

console.log('[');

function generateColourStrings() {
    COLOURS.forEach((originalColour) => {
        const colour = originalColour + permutationExtendedSuffix;

        const upperChars = colour.toUpperCase().split('');
        const lowerChars = colour.toLowerCase().split('');
        const chars = colour.split('');

        for (let p = 0 ; p < (2 ** chars.length); p++) {
            let skipPermutation = false;
            if (count >= targetCount) {
                return;
            }

            for (let i = 0 ; i < chars.length; i++) {
                const upper = (p >>> i & 1) === 1;
                if (upper && upperChars[i] === lowerChars[i]) {
                    // This would be an identical permutation, so skip.
                    skipPermutation = true;
                    break;
                }
                chars[i] = upper ? upperChars[i] : lowerChars[i];
            }

            if (skipPermutation) {
                continue;
            }

            const newColour = chars.join('');

            const json = {colourGroup: originalColour, colourCode: newColour, iteration, random: Math.round(Math.random() * 10000)};

            count++
            console.log(`${JSON.stringify(json)}${count < targetCount ? ',' : ''}`);
        }
    });
    iteration++;
}

while (count < targetCount) {
    generateColourStrings();
    console.error(`Generated ${Math.round(count/targetCount * 100)}% [${count}/${targetCount}] rows...`);
}

console.log(']');
