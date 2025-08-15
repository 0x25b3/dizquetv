const random = require('../helperFuncs').random;
const getShowData = require("./get-show-data")();
const randomJS = require("random-js");
const Random = randomJS.Random;



/****
 *
 *  Code shared by random slots and time slots for keeping track of the order
 * of episodes
 *
 **/
function shuffle(array, lo, hi, randomOverride ) {
    let r = randomOverride;
    if (typeof(r) === 'undefined') {
        r = random;
    }
    if (typeof(lo) === 'undefined') {
        lo = 0;
        hi = array.length;
    }
    let currentIndex = hi, temporaryValue, randomIndex
    while (lo !== currentIndex) {
        randomIndex =  r.integer(lo, currentIndex-1);
        currentIndex -= 1
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue
    }
    return array
}


function getShowOrderer(show) {
    if (typeof(show.orderer) === 'undefined') {

        let sortedPrograms = JSON.parse( JSON.stringify(show.programs) );
        sortedPrograms.sort((a, b) => {
            let showA = getShowData(a);
            let showB = getShowData(b);
            return showA.order - showB.order;
        });

        let position = 0;
        while (
            (position + 1 < sortedPrograms.length )
            &&
            (
                getShowData(show.founder).order
                !==
                getShowData(sortedPrograms[position]).order
            )
        ) {
            position++;
        }


        show.orderer = {

            current : () => {
                return sortedPrograms[position];
            },

            next: () => {
                position = (position + 1) % sortedPrograms.length;
            },

        }
    }
    return show.orderer;
}


function getShowShuffler(show) {
    if (typeof(show.shuffler) === 'undefined') {
        if (typeof(show.programs) === 'undefined') {
            throw Error(show.id + " has no programs?")
        }

        let sortedPrograms = JSON.parse( JSON.stringify(show.programs) );
        sortedPrograms.sort((a, b) => {
            let showA = getShowData(a);
            let showB = getShowData(b);
            return showA.order - showB.order;
        });
        let n = sortedPrograms.length;

        let randomPrograms = [];
        for (let i = 0; i < n; i++) {
            randomPrograms.push( sortedPrograms[i] );
        }

        let position = show.founder.shuffleOrder;
        if (typeof(position) === 'undefined') {
            position = random.integer(0, n - 1);
        }

        let localRandom = null;

        let initGeneration = () => {
            localRandom = new Random( randomJS.MersenneTwister19937.autoSeed() );
            for (let i = 0; i < n; i++) {
                randomPrograms[i] = sortedPrograms[i];
            }
            shuffle( randomPrograms, 0, n,  localRandom );
        };
        let generation = Math.floor( position / n );
        for (let i = 0; i <= generation; i++) {
            initGeneration();
        }
        position = position % n;
        
        show.shuffler  = {

            current : () => {
                let prog = JSON.parse(
                    JSON.stringify(randomPrograms[position % n] )
                );
                prog.shuffleOrder = position;
                return prog;
            },

            next: () => {
                position++;
                if (position % n == 0) {
                    initGeneration();
                }
            },

            getPosition: () => {
                return position;
            },

        }
    }
    return show.shuffler;
}

module.exports = {
    getShowOrderer : getShowOrderer,
    getShowShuffler: getShowShuffler,
}