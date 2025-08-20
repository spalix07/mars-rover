/**
 * Blocs pour opérer le Rover M.A.R.S. 4tronix
 */
//% weight=10 color=#e7660b icon="\uf135"
namespace marsRover {
    let PCA = 0x40;    // adresse i2c du contrôleur servo Animoid 4tronix
    let EEROM = 0x50;    // adresse i2c de l'EEROM
    let initI2C = false;
    let SERVOS = 0x06; // première adresse servo pour octet de départ bas
    let vitesseGauche = 0;
    let vitesseDroite = 0;
    let servoOffsets: number[] = [];
    let bandeLED: fireled.Band;
    let _modeMiseAJour = RVmodeMiseAJour.Auto;

    // Constantes IR du Rover MARS
    const brochePIN = DigitalPin.P16;
    const evenementIR = 1995;

    /**
      * Énumération des servos
      */
    enum RVservos {
        //% block="avant gauche"
        AvantGauche=9,
        //% block="arrière gauche"
        ArriereGauche=11,
        //% block="arrière droit"
        ArriereDroit=13,
        //% block="avant droit"
        AvantDroit=15,
        //% block="mât"
        Mat=0
    }

    /**
      * Énumération des groupes de servos
      */
    enum RVgroupeServo {
        //% block="roue"
        Roue,
        //% block="mât"
        Mat,
        //% block="tout"
        Tout
    }

    /**
      * Énumération des directions gauche/droite
      */
    enum RVdirection {
        //% block="gauche"
        Gauche,
        //% block="droite"
        Droite
    }

    /**
      * Énumération des directions avant/arrière
      */
    enum RVvecteur {
        //% block="avant"
        Avant,
        //% block="arrière"
        Arriere
    }
}