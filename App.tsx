import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions } from 'react-native';
import { LightSensor } from 'expo-sensors';
import { LineChart } from 'react-native-chart-kit';

const MAX_DATA_POINTS = 30; // Maximum number of data points to display (2 minutes with a data point every second). If it starts being laggy when too many datapoints are shown, modify this to a smaller value.
const max_solar_illuminance = 128000; // Maximum illuminance of the sun, this is defined by the solar illuminance constant

const App: React.FC = () => {
  const [data, setData] = useState<{ illuminance: number }>({ illuminance: 0 });
  const [luxData, setLuxData] = useState<number[]>([]); // Initialize luxData with an empty array
  let _subscription: ReturnType<typeof LightSensor.addListener> | null = null; // Initialize _subscription as null

  useEffect(() => {
    _toggle();

    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    if (_subscription) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _subscribe = () => {
    _subscription = LightSensor.addListener((newData) => {
      setData(newData);
      setLuxData((prevData) => {
        if (prevData.length >= MAX_DATA_POINTS) {
          return [...prevData.slice(1), newData.illuminance];
        } else {
          return [...prevData, newData.illuminance];
        }
      });
    });
  };

  const _unsubscribe = () => {
    _subscription && _subscription.remove();
    _subscription = null;
  };

  if (luxData?.length === 0) { // if array is empty, then react-native-chart-kit will fail, so the app will always crash at startup without checking explicitly https://stackoverflow.com/questions/71082961/unable-to-use-dynamic-data-into-react-native-chart-kit
    return (
      <View style={styles.sensor}>
        <Text>No chart data to display!</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.sensor}>
        <Text>Light Sensor:</Text>
        <Text>
          Illuminance: {Platform.OS === 'android' ? `${data.illuminance} lx` : `Only available on Android`}
        </Text>
        <LineChart
          data={{
            labels: luxData.map((_, index) => (index % 10 === 0 ? index.toString() : '')),
            datasets: [
                { data: luxData, }, // actual data
                { data: [0] }, // min
                //{ data: [max_solar_illuminance] }, // max
              ],
          }}
          width={Dimensions.get("window").width} // from react-native
          height={200}
          yAxisLabel="lx"
          chartConfig={{
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={_toggle} style={styles.button}>
            <Text>Toggle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 15,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
  },
  sensor: {
    marginTop: 45,
    paddingHorizontal: 10,
  },
});

export default App;