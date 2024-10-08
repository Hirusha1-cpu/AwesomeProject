import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ImageSourcePropType,
  Image,
  ScrollView,
} from 'react-native';

const API_KEY = '49624f40b0fc419b96862405240810';
const { width, height } = Dimensions.get('window');

interface WeatherData {
  location: {
    name: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    humidity: number;
    feelslike_c: number;
    wind_kph: number;
    wind_dir: string;
    condition: {
      text: string;
      icon: string;
    };
    uv: number;
  };
  forecast: {
    forecastday: Array<{
      hour: Array<{
        time: string;
        temp_c: number;
        condition: {
          text: string;
          icon: string;
        };
      }>;
    }>;
  };
}

const backgroundImages: { [key: string]: ImageSourcePropType } = {
  early_morning: require('./assets/1.jpg'),
  morning: require('./assets/2.jpg'),
  afternoon: require('./assets/3.jpg'),
  evening: require('./assets/4.jpg'),
  night: require('./assets/5.jpg'),
};

function App(): React.JSX.Element {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<ImageSourcePropType>(backgroundImages.night);

  const getBackgroundImage = (time: string) => {
    const hour = parseInt(time.split(' ')[1].split(':')[0], 10);
    if (hour < 6) return backgroundImages.night;
    if (hour < 9) return backgroundImages.early_morning;
    if (hour < 12) return backgroundImages.morning;
    if (hour < 17) return backgroundImages.afternoon;
    if (hour < 20) return backgroundImages.evening;
    return backgroundImages.night;
  };

  const updateBackgroundImage = (localtime: string) => {
    setBackgroundImage(getBackgroundImage(localtime));
  };

  useEffect(() => {
    if (weatherData) {
      updateBackgroundImage(weatherData.location.localtime);
    }
  }, [weatherData]);

  const fetchWeatherData = async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&days=2&aqi=no&alerts=no`,
      );
      const data = await response.json();
      if (response.ok) {
        setWeatherData(data);
        setError(null);
      } else {
        setError(data.error.message);
        setWeatherData(null);
      }
    } catch (err) {
      setError('Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchWeatherData(searchCity);
  };

  const renderHourlyForecast = () => {
    if (!weatherData || !weatherData.forecast) return null;

    const currentHour = new Date().getHours();
    const hourlyData = weatherData.forecast.forecastday
      .flatMap(day => day.hour)
      .filter(hour => new Date(hour.time).getHours() >= currentHour)
      .slice(0, 10);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyForecastContainer}>
        {hourlyData.map((hour, index) => (
          <View key={index} style={styles.hourlyForecastItem}>
            <Text style={styles.hourlyTime}>{new Date(hour.time).getHours()}:00</Text>
            <Image 
              source={{uri: `https:${hour.condition.icon}`}}
              style={styles.hourlyIcon}
            />
            <Text style={styles.hourlyTemp}>{Math.round(hour.temp_c)}°C</Text>
          </View>
        ))}
      </ScrollView>
    );
  };
return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter city name"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchCity}
              onChangeText={setSearchCity}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            weatherData && (
              <ScrollView contentContainerStyle={styles.weatherContainer}>
                <Text style={styles.cityName}>{weatherData.location.name}, {weatherData.location.country}</Text>
                <View style={styles.conditionContainer}>
                  <Image 
                    source={{uri: `https:${weatherData.current.condition.icon}`}}
                    style={styles.conditionIcon}
                  />
                  <Text style={styles.conditionText}>{weatherData.current.condition.text}</Text>
                </View>
                <Text style={styles.temperature}>
                  {Math.round(weatherData.current.temp_c)}°C
                </Text>
                <Text style={styles.weatherInfo}>
                  Feels like: {Math.round(weatherData.current.feelslike_c)}°C
                </Text>
                <Text style={styles.weatherInfo}>
                  Humidity: {weatherData.current.humidity}%
                </Text>
                <Text style={styles.weatherInfo}>
                  Wind: {weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}
                </Text>
                <Text style={styles.weatherInfo}>
                  UV Index: {weatherData.current.uv}
                </Text>
                <Text style={styles.weatherInfo}>
                  Local time: {weatherData.location.localtime}
                </Text>
                <Text style={styles.forecastTitle}>7-Hour Forecast</Text>
                {renderHourlyForecast()}
              </ScrollView>
            )
          )}
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    width: '90%',
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 18,
    color: 'white',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 25,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 18,
  },
  weatherContainer: {
    alignItems: 'center',
  },
  cityName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  conditionIcon: {
    width: 64,
    height: 64,
  },
  conditionText: {
    fontSize: 24,
    color: 'white',
    marginLeft: 10,
  },
  temperature: {
    fontSize: 60,
    fontWeight: '200',
    color: 'white',
  },
  weatherInfo: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  forecastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  hourlyForecastContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  hourlyForecastItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  hourlyTime: {
    color: 'white',
    fontSize: 16,
  },
  hourlyIcon: {
    width: 40,
    height: 40,
  },
  hourlyTemp: {
    color: 'white',
    fontSize: 16,
  },
});

export default App;