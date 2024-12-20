import { initViewer, loadModel, adjustPanelStyle } from './viewer.js';
import {
    SensorListExtensionID,
    SensorSpritesExtensionID,
    SensorDetailExtensionID,
    SensorHeatmapsExtensionID
} from './viewer.js';
import { initTimeline } from './timeline.js';
import { MyDataView } from './dataview.js';
import {
    APS_MODEL_URN,
    APS_MODEL_VIEW,
    APS_MODEL_DEFAULT_FLOOR_INDEX,
    DEFAULT_TIMERANGE_START,
    DEFAULT_TIMERANGE_END
} from './config.js';

const EXTENSIONS = [
    SensorListExtensionID,
    SensorSpritesExtensionID,
    SensorDetailExtensionID,
    SensorHeatmapsExtensionID,
    'Autodesk.AEC.LevelsExtension'
];

const viewer = await initViewer(document.getElementById('preview'), EXTENSIONS);
loadModel(viewer, APS_MODEL_URN, APS_MODEL_VIEW);
viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, async () => {
    // Initialize the timeline
    initTimeline(document.getElementById('timeline'), onTimeRangeChanged, onTimeMarkerChanged);

    const sensorHeatmapsExt = viewer.getExtension(SensorHeatmapsExtensionID);
    window.sensorHeatmapsExt = sensorHeatmapsExt;

    // Initialize our data view
    const dataView = new MyDataView();
    await dataView.init({ start: DEFAULT_TIMERANGE_START, end: DEFAULT_TIMERANGE_END });

    // Configure and activate our custom IoT extensions
    const extensions = [SensorListExtensionID, SensorSpritesExtensionID, SensorDetailExtensionID, SensorHeatmapsExtensionID].map(id => viewer.getExtension(id));
    for (const ext of extensions) {
        ext.dataView = dataView;
        ext.activate();
    }
    adjustPanelStyle(viewer.getExtension(SensorListExtensionID).panel, { right: '10px', top: '10px', width: '500px', height: '300px' });
    adjustPanelStyle(viewer.getExtension(SensorDetailExtensionID).panel, { right: '10px', top: '320px', width: '500px', height: '300px' });
    adjustPanelStyle(viewer.getExtension(SensorHeatmapsExtensionID).panel, { left: '10px', top: '320px', width: '300px', height: '150px' });

    // Configure and activate the levels extension
    const levelsExt = viewer.getExtension('Autodesk.AEC.LevelsExtension');
    levelsExt.levelsPanel.setVisible(true);
    levelsExt.floorSelector.addEventListener(Autodesk.AEC.FloorSelector.SELECTED_FLOOR_CHANGED, onLevelChanged);
    levelsExt.floorSelector.selectFloor(APS_MODEL_DEFAULT_FLOOR_INDEX, true);
    adjustPanelStyle(levelsExt.levelsPanel, { left: '10px', top: '10px', width: '300px', height: '300px' });

    viewer.getExtension(SensorListExtensionID).onSensorClicked = (sensorId) => onCurrentSensorChanged(sensorId);
    viewer.getExtension(SensorSpritesExtensionID).onSensorClicked = (sensorId) => onCurrentSensorChanged(sensorId);
    viewer.getExtension(SensorHeatmapsExtensionID).onChannelChanged = (channelId) => onCurrentChannelChanged(channelId);
    onTimeRangeChanged(DEFAULT_TIMERANGE_START, DEFAULT_TIMERANGE_END);

    async function onTimeRangeChanged(start, end) {
        await dataView.refresh({ start, end });
        extensions.forEach(ext => ext.dataView = dataView);
    }

    function onLevelChanged({ target, levelIndex }) {
        dataView.floor = levelIndex !== undefined ? target.floorData[levelIndex] : null;
        extensions.forEach(ext => ext.dataView = dataView);
    }

    function onTimeMarkerChanged(time) {
        extensions.forEach(ext => ext.currentTime = time);
    }

    function onCurrentSensorChanged(sensorId) {
        const sensor = dataView.getSensors().get(sensorId);
        if (sensor && sensor.objectId) {
            viewer.fitToView([sensor.objectId]);
        }
        extensions.forEach(ext => ext.currentSensorID = sensorId);
    }

    function onCurrentChannelChanged(channelId) {
        extensions.forEach(ext => ext.currentChannelID = channelId);
    }

    // Função para buscar o último valor do servidor
    async function fetchLatestSensorData() {
        try {
            const response = await fetch('/api/sensors/latest');
            if (!response.ok) throw new Error('Erro ao buscar os dados do servidor.');
            const latestData = await response.json();
            return latestData;
        } catch (err) {
            console.error('Erro ao buscar o valor mais recente:', err);
            return null;
        }
    }

    // Função para atualizar o heatmap com o último valor do servidor
    function updateHeatmapWithLatestData() {
        fetchLatestSensorData().then((data) => {
            if (data) {
                const { temperature, co2 } = data; // Ajuste conforme necessário
                console.log('temperature, co2', temperature, co2)
                const customSensorValue = () => temperature; // Usar temperatura como exemplo

                if (window.sensorHeatmapsExt) {
                    window.sensorHeatmapsExt.updateHeatmaps(customSensorValue);
                    console.log(`Heatmap updated with temperature: ${temperature}, co2: ${co2}`);
                } else {
                    console.error('Heatmap extension not loaded.');
                }
            }
        });
    }

    // Configura para buscar o último valor a cada 5 segundos (5000 ms)
    setInterval(updateHeatmapWithLatestData, 500);
});

window.getBoundingBox = function (model, dbid) {
    const tree = model.getInstanceTree();
    const frags = model.getFragmentList();
    const bounds = new THREE.Box3();
    const result = new THREE.Box3();
    tree.enumNodeFragments(dbid, function (fragid) {
        frags.getWorldBounds(fragid, bounds);
        result.union(bounds);
    }, true);
    return result;
};
