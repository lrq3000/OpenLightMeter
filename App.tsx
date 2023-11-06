import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions, TextInput } from 'react-native';
import { LightSensor } from 'expo-sensors';
import { LineChart } from 'react-native-chart-kit';

const MAX_DATA_POINTS = 30; // Maximum number of data points to display (2 minutes with a data point every second). If it starts being laggy when too many datapoints are shown, modify this to a smaller value.
const max_solar_illuminance = 128000; // Maximum illuminance of the sun, this is defined by the solar illuminance constant

const App: React.FC = () => {
  const [luxData, setLuxData] = useState<number[]>([]); // Initialize luxData with an empty array
  let _subscription: ReturnType<typeof LightSensor.addListener> | null = null; // Initialize _subscription as null

  const [maxDataPoints, setMaxDataPoints] = useState(MAX_DATA_POINTS);
  const [newMaxDataPoints, setNewMaxDataPoints] = useState(MAX_DATA_POINTS.toString());

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
      setLuxData((prevData) => {
        console.log(maxDataPoints + ` and ` + prevData.length)  // debuglines
        if (prevData.length >= maxDataPoints) {
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

  const handleInputChangeMaxDataPoints = (text: string) => {
    setNewMaxDataPoints(text);
  };

  const handleUpdateMaxDataPoints = () => {
    const newMaxDataPointsValue = parseInt(newMaxDataPoints, 10);
    if (!isNaN(newMaxDataPointsValue) && newMaxDataPointsValue >= 1) {
      // If new size is valid (not null and strictly positve), set new value into maxDataPoints and reslice luxData array
      setMaxDataPoints(newMaxDataPointsValue);  // to limit future growth
      resizeLuxData();  // to slice down now if array is too big given new size
    }
  };

  const resizeLuxData = () => {
    setLuxData((prevData) => {
      if (prevData.length > maxDataPoints) {
        // If maxDataPoints is shorter than luxData current size, we resize down by slicing
        return prevData.slice(prevData.length - maxDataPoints);
        // Otherwise, if greater or equal, it will be managed directly in the if condition in _subscribe()
      } else {
        return prevData;
      }
    });
  };

  return (
    <View style={styles.sensor}>
      { Platform.OS !== 'android' ? <Text>`Only available on Android`</Text> : (
        (luxData?.length === 0) ? (  // if array is empty, then react-native-chart-kit will fail, so the app will always crash at startup without checking explicitly https://stackoverflow.com/questions/71082961/unable-to-use-dynamic-data-into-react-native-chart-kit
          <Text>No chart data to display!</Text>
        ) : (
          <>
            <Text>Max Data Points: {maxDataPoints} - luxData.length: {luxData.length}</Text>
            <Text>Light Sensor:</Text>
            <Text>
              Illuminance: {luxData.slice(-1)} lux
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
              width={Dimensions.get('window').width}
              height={200}
              yAxisLabel="lux "
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newMaxDataPoints}
                onChangeText={handleInputChangeMaxDataPoints}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={handleUpdateMaxDataPoints} style={styles.updateButton}>
                <Text>Update Max Data Points</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={_toggle} style={styles.button}>
                <Text>Toggle</Text>
              </TouchableOpacity>
            </View>
          </>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
  },
  updateButton: {
    backgroundColor: '#eee',
    padding: 10,
  },
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