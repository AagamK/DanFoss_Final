import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator, RotateCcw } from "lucide-react"; // Import Calculator and Reset icons
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* This enum tracks the *last input the user typed into* so we only
  calculate the *other* fields, preventing infinite loops.
*/
enum LastChangedField {
    NONE,
    // Cylinder
    CYL_DIAMETER,
    CYL_ROD,
    CYL_PRESSURE,
    CYL_FORCE_EXT,
    CYL_FORCE_RET,
    CYL_FLOW,
    CYL_VEL_EXT,
    CYL_VEL_RET,
    // Pump
    PUMP_DISPLACEMENT,
    PUMP_RPM,
    PUMP_PRESSURE,
    PUMP_FLOW,
    PUMP_EFF,
    // Motor
    MOT_DISPLACEMENT,
    MOT_RPM,
    MOT_PRESSURE,
    MOT_FLOW,
    MOT_MECH_EFF,
    MOT_VOL_EFF,
}

// Helper to safely parse floats from string inputs
const safeParse = (val: string): number => parseFloat(val) || 0;

// Helper to format numbers back to strings for the UI
const formatNum = (num: number, precision = 2): string => {
    if (isNaN(num) || !isFinite(num)) return "";
    return num.toFixed(precision);
};

export const HydraulicCalculator = () => {
    // --- STATE MANAGEMENT ---
    const [lastChanged, setLastChanged] = useState<LastChangedField>(LastChangedField.NONE);

    // --- Cylinder States ---
    const [cylPistonDiameter, setCylPistonDiameter] = useState("75");
    const [cylRodDiameter, setCylRodDiameter] = useState("45");
    const [cylPressure, setCylPressure] = useState("210");
    const [cylFlow, setCylFlow] = useState("53");
    const [cylForceExt, setCylForceExt] = useState("");
    const [cylForceRet, setCylForceRet] = useState("");
    const [cylRatio, setCylRatio] = useState("");
    const [cylVelExt, setCylVelExt] = useState("");
    const [cylVelRet, setCylVelRet] = useState("");

    // --- Pump States ---
    const [pumpDisplacement, setPumpDisplacement] = useState("35");
    const [pumpRpm, setPumpRpm] = useState("1800");
    const [pumpPressure, setPumpPressure] = useState("210");
    const [pumpEff, setPumpEff] = useState("0.9");
    const [pumpFlow, setPumpFlow] = useState("");
    const [pumpPower, setPumpPower] = useState("");

    // --- Motor States ---
    const [motDisplacement, setMotDisplacement] = useState("50");
    const [motPressure, setMotPressure] = useState("210");
    const [motRpm, setMotRpm] = useState("1500");
    const [motFlow, setMotFlow] = useState("80");
    const [motMechEff, setMotMechEff] = useState("0.92");
    const [motVolEff, setMotVolEff] = useState("0.95");
    const [motTorque, setMotTorque] = useState("");
    const [motPower, setMotPower] = useState("");
    const [motTotalEff, setMotTotalEff] = useState("");

    // --- MAIN CALCULATION FUNCTION ---
    // This function reads all current states and performs the math.
    const handleCalculate = useCallback(() => {
        // --- Parse all cylinder values safely ---
        const D = safeParse(cylPistonDiameter); // mm
        const d = safeParse(cylRodDiameter); // mm
        let P_cyl = safeParse(cylPressure); // bar
        let F_ext = safeParse(cylForceExt); // kN
        let F_ret = safeParse(cylForceRet); // kN
        let Q_cyl = safeParse(cylFlow); // l/min
        let v_ext = safeParse(cylVelExt); // m/s
        let v_ret = safeParse(cylVelRet); // m/s

        const A_bore = Math.PI * Math.pow(D / 2, 2); // mm^2
        const A_rod = Math.PI * (Math.pow(D / 2, 2) - Math.pow(d / 2, 2)); // mm^2
        const ratio = A_bore / A_rod;

        // Calculate cylinder values based on the last field the user changed
        switch (lastChanged) {
            case LastChangedField.CYL_FORCE_EXT:
                P_cyl = (F_ext * 10000) / A_bore; // kN -> bar
                break;
            case LastChangedField.CYL_FORCE_RET:
                P_cyl = (F_ret * 10000) / A_rod; // kN -> bar
                break;
            case LastChangedField.CYL_VEL_EXT:
                Q_cyl = (v_ext * A_bore * 60000) / 1000000; // l/min
                break;
            case LastChangedField.CYL_VEL_RET:
                Q_cyl = (v_ret * A_rod * 60000) / 1000000; // l/min
                break;
            default: // Includes NONE, CYL_DIAMETER, CYL_ROD, CYL_PRESSURE, CYL_FLOW
                F_ext = (P_cyl * A_bore) / 10000; // (bar * mm^2) -> kN
                F_ret = (P_cyl * A_rod) / 10000; // (bar * mm^2) -> kN
                v_ext = (Q_cyl * 1000000) / (A_bore * 60000); // m/s
                v_ret = (Q_cyl * 1000000) / (A_rod * 60000);
                break;
        }

        // Update all calculated cylinder fields, *except* the one that triggered the calculation
        if (lastChanged !== LastChangedField.CYL_PRESSURE) setCylPressure(formatNum(P_cyl));
        if (lastChanged !== LastChangedField.CYL_FORCE_EXT) setCylForceExt(formatNum(F_ext));
        if (lastChanged !== LastChangedField.CYL_FORCE_RET) setCylForceRet(formatNum(F_ret));
        if (lastChanged !== LastChangedField.CYL_FLOW) setCylFlow(formatNum(Q_cyl));
        if (lastChanged !== LastChangedField.CYL_VEL_EXT) setCylVelExt(formatNum(v_ext, 3));
        if (lastChanged !== LastChangedField.CYL_VEL_RET) setCylVelRet(formatNum(v_ret, 3));
        setCylRatio(formatNum(ratio));

        // --- Pump Calculations ---
        let q_pump = (safeParse(pumpDisplacement) * safeParse(pumpRpm)) / 1000; // (cc/rev * rpm) -> l/min
        let disp_pump = safeParse(pumpDisplacement);

        if (lastChanged === LastChangedField.PUMP_FLOW) {
            disp_pump = (safeParse(pumpFlow) * 1000) / safeParse(pumpRpm); // cc/rev
            setPumpDisplacement(formatNum(disp_pump));
        } else {
            setPumpFlow(formatNum(q_pump));
        }
        const pwr_pump = (Math.max(q_pump, safeParse(pumpFlow)) * safeParse(pumpPressure)) / (600 * safeParse(pumpEff)); // kW
        setPumpPower(formatNum(pwr_pump));

        // --- Motor Calculations ---
        const p_mot = safeParse(motPressure);
        let disp_mot = safeParse(motDisplacement);
        const q_mot = safeParse(motFlow);
        const v_eff = safeParse(motVolEff);
        const m_eff = safeParse(motMechEff);
        let rpm_mot = safeParse(motRpm);

        if (lastChanged === LastChangedField.MOT_RPM) {
            disp_mot = (q_mot * 1000 * v_eff) / rpm_mot;
            setMotDisplacement(formatNum(disp_mot));
        } else {
            rpm_mot = (q_mot * 1000 * v_eff) / disp_mot;
            setMotRpm(formatNum(rpm_mot, 0));
        }

        const torque_mot = (disp_mot * p_mot * m_eff) / (20 * Math.PI); // Nm
        const power_mot = (torque_mot * rpm_mot) / 9550; // kW
        const total_eff = m_eff * v_eff;

        setMotTorque(formatNum(torque_mot));
        setMotPower(formatNum(power_mot));
        setMotTotalEff(formatNum(total_eff, 3));

    }, [
        // This function needs to be re-created if any of these values change
        cylPistonDiameter, cylRodDiameter, cylPressure, cylFlow, cylForceExt, cylForceRet, cylVelExt, cylVelRet,
        pumpDisplacement, pumpRpm, pumpPressure, pumpEff, pumpFlow,
        motDisplacement, motPressure, motRpm, motFlow, motMechEff, motVolEff,
        lastChanged
    ]);

    // --- **THIS IS THE FIX** ---
    // This hook runs the calculation ONLY ONCE when the component first mounts.
    // This populates the output fields with values from the default inputs.
    useEffect(() => {
        handleCalculate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <-- Empty dependency array ensures this runs ONLY ONCE.
    // We disable the lint warning because we *intentionally* do not want
    // this to re-run when handleCalculate (or its dependencies) change.

    // --- Reset Functions ---
    const resetCylinder = () => {
        setLastChanged(LastChangedField.NONE);
        setCylPistonDiameter("75");
        setCylRodDiameter("45");
        setCylPressure("210");
        setCylFlow("53");
        // Clear outputs, user must click Calculate
        setCylForceExt("");
        setCylForceRet("");
        setCylRatio("");
        setCylVelExt("");
        setCylVelRet("");
    };

    const resetPump = () => {
        setLastChanged(LastChangedField.NONE);
        setPumpDisplacement("35");
        setPumpRpm("1800");
        setPumpPressure("210");
        setPumpEff("0.9");
        setPumpFlow("");
        setPumpPower("");
    };

    const resetMotor = () => {
        setLastChanged(LastChangedField.NONE);
        setMotDisplacement("50");
        setMotPressure("210");
        setMotRpm("1500");
        setMotFlow("80");
        setMotMechEff("0.92");
        setMotVolEff("0.95");
        setMotTorque("");
        setMotPower("");
        setMotTotalEff("");
    };

    const Navigate = useNavigate();

    // --- JSX RENDER ---
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" onClick={() => Navigate('/')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                </Button>
            </div>
            <h1 className="text-3xl font-bold mb-6">Hydraulic Calculator</h1>

            <Tabs defaultValue="cylinder" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cylinder">Cylinder</TabsTrigger>
                    <TabsTrigger value="pump">Pump</TabsTrigger>
                    <TabsTrigger value="motor">Motor</TabsTrigger>
                </TabsList>

                {/* --- CYLINDER TAB --- */}
                <TabsContent value="cylinder">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Cylinder Calculations</CardTitle>
                            {/* --- Button Group --- */}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={resetCylinder}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                                <Button size="sm" onClick={handleCalculate}>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Inputs Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-piston-dia">Piston Diameter (mm)</Label>
                                    <Input id="cyl-piston-dia" type="number" value={cylPistonDiameter}
                                        onChange={(e) => { setCylPistonDiameter(e.target.value); setLastChanged(LastChangedField.CYL_DIAMETER); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-rod-dia">Rod Diameter (mm)</Label>
                                    <Input id="cyl-rod-dia" type="number" value={cylRodDiameter}
                                        onChange={(e) => { setCylRodDiameter(e.target.value); setLastChanged(LastChangedField.CYL_ROD); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-pressure">Pressure (bar)</Label>
                                    <Input id="cyl-pressure" type="number" value={cylPressure}
                                        onChange={(e) => { setCylPressure(e.target.value); setLastChanged(LastChangedField.CYL_PRESSURE); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-flow">Flow Rate (l/min)</Label>
                                    <Input id="cyl-flow" type="number" value={cylFlow}
                                        onChange={(e) => { setCylFlow(e.target.value); setLastChanged(LastChangedField.CYL_FLOW); }} />
                                </div>
                            </div>

                            {/* Outputs Column */}
                            <div className="space-y-4 rounded-lg bg-muted p-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-force-ext">Bore Force (kN)</Label>
                                    <Input id="cyl-force-ext" value={cylForceExt} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-force-ret">Rod Force (kN)</Label>
                                    <Input id="cyl-force-ret" value={cylForceRet} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-vel-ext">Velocity Extend (m/s)</Label>
                                    <Input id="cyl-vel-ext" value={cylVelExt} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-vel-ret">Velocity Retract (m/s)</Label>
                                    <Input id="cyl-vel-ret" value={cylVelRet} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cyl-ratio">Area Ratio</Label>
                                    <Input id="cyl-ratio" value={cylRatio} readOnly className="font-bold text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PUMP TAB --- */}
                <TabsContent value="pump">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Pump Calculations</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={resetPump}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                                <Button size="sm" onClick={handleCalculate}>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pump-disp">Displacement (cc/rev)</Label>
                                    <Input id="pump-disp" type="number" value={pumpDisplacement}
                                        onChange={(e) => { setPumpDisplacement(e.target.value); setLastChanged(LastChangedField.PUMP_DISPLACEMENT); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pump-rpm">Pump Speed (rpm)</Label>
                                    <Input id="pump-rpm" type="number" value={pumpRpm}
                                        onChange={(e) => { setPumpRpm(e.target.value); setLastChanged(LastChangedField.PUMP_RPM); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pump-pressure">Pressure (bar)</Label>
                                    <Input id="pump-pressure" type="number" value={pumpPressure}
                                        onChange={(e) => { setPumpPressure(e.target.value); setLastChanged(LastChangedField.PUMP_PRESSURE); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pump-eff">Overall Efficiency (0.0 - 1.0)</Label>
                                    <Input id="pump-eff" type="number" step="0.01" value={pumpEff}
                                        onChange={(e) => { setPumpEff(e.target.value); setLastChanged(LastChangedField.PUMP_EFF); }} />
                                </div>
                            </div>
                            {/* Outputs */}
                            <div className="space-y-4 rounded-lg bg-muted p-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pump-flow">Theoretical Flow Rate (l/min)</Label>
                                    <Input id="pump-flow" value={pumpFlow} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pump-power">Required Input Power (kW)</Label>
                                    <Input id="pump-power" value={pumpPower} readOnly className="font-bold text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- MOTOR TAB --- */}
                <TabsContent value="motor">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Motor Calculations</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={resetMotor}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                                <Button size="sm" onClick={handleCalculate}>
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calculate
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {/* Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mot-disp">Displacement (cc/rev)</Label>
                                    <Input id="mot-disp" type="number" value={motDisplacement}
                                        onChange={(e) => { setMotDisplacement(e.target.value); setLastChanged(LastChangedField.MOT_DISPLACEMENT); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-pressure">Pressure (bar)</Label>
                                    <Input id="mot-pressure" type="number" value={motPressure}
                                        onChange={(e) => { setMotPressure(e.target.value); setLastChanged(LastChangedField.MOT_PRESSURE); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-flow">Input Flow (l/min)</Label>
                                    <Input id="mot-flow" type="number" value={motFlow}
                                        onChange={(e) => { setMotFlow(e.target.value); setLastChanged(LastChangedField.MOT_FLOW); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-mech-eff">Mechanical Efficiency (0.0 - 1.0)</Label>
                                    <Input id="mot-mech-eff" type="number" step="0.01" value={motMechEff}
                                        onChange={(e) => { setMotMechEff(e.target.value); setLastChanged(LastChangedField.MOT_MECH_EFF); }} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-vol-eff">Volumetric Efficiency (0.0 - 1.0)</Label>
                                    <Input id="mot-vol-eff" type="number" step="0.01" value={motVolEff}
                                        onChange={(e) => { setMotVolEff(e.target.value); setLastChanged(LastChangedField.MOT_VOL_EFF); }} />
                                </div>
                            </div>
                            {/* Outputs */}
                            <div className="space-y-4 rounded-lg bg-muted p-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mot-rpm">Output Speed (rpm)</Label>
                                    <Input id="mot-rpm" value={motRpm} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-torque">Output Torque (Nm)</Label>
                                    <Input id="mot-torque" value={motTorque} readOnly className="font-bold text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mot-power">Output Power (kW)</Label>
                                    <Input id="mot-power" value={motPower} readOnly className="font-bold text-primary" />
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <Label htmlFor="mot-total-eff">Total Efficiency</Label>
                                    <Input id="mot-total-eff" value={motTotalEff} readOnly className="font-bold text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
};

export default HydraulicCalculator;