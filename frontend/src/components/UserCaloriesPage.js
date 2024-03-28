import React, { useEffect, useState, useMemo, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  ListItem,
  List,
  CardMedia,
  InputAdornment,
  ListSubheader,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import WhatshotIcon from "@material-ui/icons/Whatshot";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import SportsMartialArtsIcon from "@mui/icons-material/SportsMartialArts";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import StarIcon from "@mui/icons-material/Star";
import TimelineIcon from "@mui/icons-material/Timeline";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import TodayIcon from "@mui/icons-material/Today";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import Footer from "./Footer";
import { useReactToPrint } from "react-to-print";

const containsText = (text, searchText) =>
  text.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
  
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function UserCaloriesPage(props) {
  const printRef = useRef();
  const [loading, setLoading] = useState(false);
  const [todayCaloriesConsumed, setTodayCaloriesConsumed] = useState(0);
  const [todayCaloriesBurned, setTodayCaloriesBurned] = useState(0);
  const [todayGoal, setTodayGoal] = useState(0);
  const [events, setEvents] = useState([]);
  const COLORS = ["#8b0e0e", "#97a3a2"];
  const [foodItems, setFoodItems] = useState({});
  const [dietHistory, setDietHistory] = useState([]);
  const [weekHistory, setWeekHistory] = useState([]);
  const [reloadTodayData, setReloadTodayData] = useState(false);
  const toggleTodayUpdate = () => {
    setReloadTodayData(!reloadTodayData);
  };
  const randomExercise = getRandomInt(0, 7);
  const exerciseList = [
    "Bent tricep extension",
    "Front Raises",
    "Sumo bicep raises",
    "Kick backs",
    "Weighted punches",
    "Leg kicks",
    "Jump claps",
  ];
  useEffect(() => {
    // Make API call to backend to get food items and their calories from DB.
    axios({
      method: "GET",
      url: "/foodCalorieMapping",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
    })
      .then((response) => {
        const res = response.data;
        setFoodItems(res);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });

    // Make API call to backend to get last 7 days history from DB.
    axios({
      method: "POST",
      url: "/weekHistory",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
      data: {
        todayDate: dayjs().format("MM/DD/YYYY"),
      },
    })
      .then((response) => {
        const res = response.data;
        setDietHistory(res.sort((a, b) => b.dayIndex - a.dayIndex));
        let weekData = [];
        for (let i = -3; i <= 3; i++) {
          const date = dayjs().add(i, "day").format("YYYY-MM-DD");
          const dataForDay = res.find(
            (d) => dayjs(d.date).format("YYYY-MM-DD") === date
          );

          weekData.push({
            date: date,
            consumedCalories: dataForDay ? dataForDay.caloriesConsumed : 0,
            burntCalories: dataForDay ? dataForDay.burntCalories : 0,
          });
        }
        setTodayCaloriesConsumed(res[6]["caloriesConsumed"]);
        setTodayCaloriesBurned(res[6]["burntCalories"]);
        setWeekHistory(weekData);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });

    axios({
      method: "GET",
      url: "/profile",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
    })
      .then((response) => {
        const res = JSON.parse(response["data"]);
        setTodayGoal(res.target_calories);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });

    // Make API call to backend to get events user registered for from DB.
    axios({
      method: "GET",
      url: "/usersEvents",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
    })
      .then((response) => {
        const res = response.data;
        console.log(res);
        setEvents(res);
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });
  }, [reloadTodayData, props.state.token]);
  const [searchText, setSearchText] = useState("");
  const [intakeItem, setIntakeItem] = useState("");
  const [intakeCalories, setIntakeCalories] = useState("");

  const handleIntakeItemChange = (event) => {
    setIntakeItem(event.target.value);
    setIntakeCalories(foodItems[event.target.value]);
  };
  const displayedOptions = useMemo(
    () =>
      Object.keys(foodItems).filter((option) =>
        containsText(option, searchText)
      ),
    [foodItems, searchText]
  );
  const [intakeDate, setIntakeDate] = useState(dayjs());
  const handleAddCalorieIntake = (e) => {
    setLoading(true);
    e.preventDefault();
    axios({
      method: "POST",
      url: "/caloriesConsumed",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
      data: {
        intakeFoodItem: intakeItem,
        intakeCalories: intakeCalories,
        intakeDate: intakeDate.format("MM/DD/YYYY"),
      },
    })
      .then((response) => {
        const res = response.data;
        console.log(res);
        toggleTodayUpdate();
        setIntakeItem("");
        setIntakeCalories("");
        setIntakeDate(dayjs());
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const [burntoutCalories, setBurntoutCalories] = useState("");
  const [burnoutDate, setBurnoutDate] = useState(dayjs());
  const handleAddCalorieBurnout = (e) => {
    e.preventDefault();
    axios({
      method: "POST",
      url: "/caloriesBurned",
      headers: {
        Authorization: "Bearer " + props.state.token,
      },
      data: {
        burntoutCalories: burntoutCalories,
        burnoutDate: burnoutDate.format("MM/DD/YYYY"),
      },
    })
      .then((response) => {
        const res = response.data;
        console.log(res);
        toggleTodayUpdate();
        setBurntoutCalories("");
        setBurnoutDate(dayjs());
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
      });
  };
  console.log(todayCaloriesBurned);
  console.log(todayCaloriesConsumed);

  const history = useHistory();

  const redirectToEventWithModalOpen = (eventName) => {
    history.push({
      pathname: "/Events",
      state: { openModalForEvent: eventName },
    });
  };

  const handleImage = (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    axios
      .post("/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log(response);
        let res = response.data;
        res = res.charAt(0).toUpperCase() + res.slice(1);
        setIntakeItem(res);
        setIntakeCalories(foodItems[res]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleUnenroll = (eventName) => {
    console.log("Unenrolling from event:", eventName);
    axios
      .post(
        "/unenroll",
        {
          eventTitle: eventName,
        },
        {
          headers: {
            Authorization: "Bearer " + props.state.token,
          },
        }
      )
      .then((response) => {
        window.location.reload(false);
        console.log("Unenrollment successful:", response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("An error occurred while unenrolling: ", error);
      });
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  return (
    <>
      {loading && (
        <div
          style={{
            width: "100vw",
            height: "100%",
            display: "grid",
            placeContent: "center",
            background: "#0007",
            position: "absolute",
            top: "0",
            fontSize: "5rem",
          }}
        >
          👻
        </div>
      )}
      <Container
        maxWidth
        style={{ background: `var(--black)`, paddingBottom: "20px" }}
      >
        <button
          style={{
            color: "black",
            background: "var(--green)",
            padding: "10px 20px",
            cursor: "pointer",
          }}
          onClick={handlePrint}
        >
          Print
        </button>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 2,
            gridTemplateRows: "auto",
            gridTemplateAreas: `"today today exercise exercise intake intake intake"
                              "week week week week burntout burntout burntout"
                              "week week week week events events events"
                              "hist hist hist hist hist hist hist"`,
            paddingTop: "2rem",
          }}
        >
          <Card sx={{ gridArea: "today", background: "#BBE1C3" }} elevation={5}>
            <CardHeader
              title={"Todays Stats"}
              subheader={"Today's calorie intake and burnout"}
              avatar={<StarIcon />}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart width={375} height={160}>
                  <Pie
                    data={[
                      {
                        name: "Calories Consumed",
                        value: todayCaloriesConsumed,
                      },
                      {
                        name: "Calories to goal",
                        value:
                          0 > todayGoal - todayCaloriesConsumed
                            ? 0
                            : todayGoal - todayCaloriesConsumed,
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={60}
                    fill="#8b0e0e"
                  >
                    {COLORS.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Pie
                    data={[
                      { name: "Calories Burned", value: todayCaloriesBurned },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    fill="#19229e"
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card
            sx={{ gridArea: "exercise", background: "#A4CE95" }}
            elevation={5}
          >
            <CardHeader
              title={"Featured Exercise"}
              subheader={exerciseList[randomExercise - 1]}
              avatar={<FitnessCenterIcon />}
              sx={{ marginBottom: 3 }}
            />
            <CardContent align="center">
              <CardMedia
                style={{ mixBlendMode: "multiply", scale: "1.4" }}
                width={375}
                height={300}
                component="img"
                image={"/assets/img/featured/" + randomExercise + ".gif"}
              />
            </CardContent>
          </Card>
          <Card
            sx={{ gridArea: "intake", background: `#D9EDBF` }}
            elevation={5}
          >
            <CardHeader
              title={"Calorie Intake"}
              subheader={"Enter the food and calories consumed to track it"}
              avatar={<FastfoodIcon />}
            />
            <CardContent>
              <form onSubmit={handleAddCalorieIntake}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ paddingBottom: "1rem" }}>
                    <FormControl fullWidth>
                      <InputLabel id="intakeFoodName">
                        Food Item Name
                      </InputLabel>
                      <Select
                        MenuProps={{ autoFocus: false }}
                        labelId="intakeFoodName"
                        id="search-select"
                        value={intakeItem}
                        label="Food Item Name"
                        onChange={handleIntakeItemChange}
                        required
                      >
                        <ListSubheader>
                          <TextField
                            size="small"
                            // Autofocus on textfield
                            autoFocus
                            placeholder="Type to search..."
                            fullWidth
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== "Escape") {
                                // Prevents autoselecting item while typing (default Select behaviour)
                                e.stopPropagation();
                              }
                            }}
                          />
                        </ListSubheader>
                        {displayedOptions.map((option, i) => (
                          <MenuItem key={i} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <TextField
                      label="Calories"
                      id="intakeCalorieCount"
                      value={intakeCalories}
                      onChange={(event) => {
                        setIntakeCalories(event.target.value);
                      }}
                      type="number"
                      required
                    />
                    <DatePicker
                      label="Date"
                      value={intakeDate}
                      onChange={(newValue) => setIntakeDate(newValue)}
                      maxDate={dayjs()}
                      required
                    />
                    <input
                      type="file"
                      name="file"
                      onChange={(e) => handleImage(e)}
                      class="form-control"
                      autocomplete="off"
                      placeholder="Upload Food Image"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      style={{
                        backgroundColor: `var(--green)`,
                        color: "white",
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              </form>
            </CardContent>
          </Card>
          <Card
            sx={{ gridArea: "events", background: `#90D26D` }}
            elevation={5}
          >
            <CardHeader
              title={"Upcoming Events"}
              subheader={"These are the upcoming events you are enrolled in"}
              avatar={
                <>
                  <SportsMartialArtsIcon />
                  <DirectionsRunIcon />
                </>
              }
            />
            <CardContent>
              <List>
                {events.map((eventObj, ind) => {
                  return (
                    <ListItem
                      key={`item-${ind}`}
                      sx={{
                        display: "flex",
                        justifyContent: "space-around",
                      }}
                    >
                      <div
                        onClick={() =>
                          redirectToEventWithModalOpen(eventObj.eventName)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {eventObj.eventName}
                      </div>

                      <div>{eventObj.date}</div>
                      <Button
                        variant="contained"
                        style={{ backgroundColor: `var(--grey)` }}
                        onClick={() => handleUnenroll(eventObj.eventName)} // Replace `eventName` with the actual property name if different
                      >
                        Unenroll
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
          <Card sx={{ gridArea: "week", background: `#627254` }} elevation={5}>
            <CardHeader
              title={"Weekly Stats"}
              subheader={"Track your performance over the last week"}
              avatar={<TimelineIcon />}
            />
            <CardContent>
              <LineChart
                width={800}
                height={300}
                data={weekHistory}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="consumedCalories"
                  stroke="#19229e"
                />
                <Line
                  type="monotone"
                  dataKey="burntCalories"
                  stroke="#8b0e0e"
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </CardContent>
          </Card>
          <Card
            sx={{ gridArea: "burntout", background: `#7FC29B` }}
            elevation={5}
          >
            <CardHeader
              title={"Calorie Burn Out"}
              subheader={"Enter the calories burnt out"}
              avatar={<WhatshotIcon />}
            />
            <CardContent>
              <form onSubmit={handleAddCalorieBurnout}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <TextField
                    label="Calories"
                    id="burntoutCalorieCount"
                    value={burntoutCalories}
                    onChange={(event) => {
                      setBurntoutCalories(event.target.value);
                    }}
                    type="number"
                    required
                  />
                  <DatePicker
                    label="Date"
                    value={burnoutDate}
                    onChange={(newValue) => setBurnoutDate(newValue)}
                    maxDate={dayjs()}
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    style={{ backgroundColor: `var(--green)`, color: "white" }}
                  >
                    Add
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
          <Card sx={{ gridArea: "hist", background: `#E5E483` }} elevation={5}>
            <CardHeader
              title={"Diet Tracker"}
              subheader={"This Week's Calories Consumed"}
              avatar={
                <>
                  <LunchDiningIcon />
                  <LocalCafeIcon />
                </>
              }
            />
            <CardContent
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 2,
                gridTemplateRows: "auto",
                gridTemplateAreas: `"day-0 day-1 day-2 day-3 day-4 day-5 day-6"`,
              }}
            >
              {dietHistory.map((day, index) => {
                return (
                  <Card
                    ref={printRef}
                    sx={{ gridArea: `day-${day.dayIndex}` }}
                    elevation={5}
                  >
                    <CardHeader title={day.date} avatar={<TodayIcon />} />
                    <CardContent>
                      <div
                        style={{
                          color: day.exceededDailyLimit ? "red" : "green",
                          textAlign: "center",
                          fontWeight: "bold",
                          paddingBottom: "10px",
                        }}
                      >{`Total Calories : ${day.caloriesConsumed}`}</div>
                      <div style={{ textAlign: "center", fontWeight: "bold" }}>
                        Food Consumed
                      </div>
                      <div>
                        <List>
                          {day.foodConsumed.map((itemObj, ind) => {
                            return (
                              <ListItem
                                key={`item-${ind}`}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                }}
                              >
                                <div>{itemObj.item}</div>
                                <div>{itemObj.calories}</div>
                              </ListItem>
                            );
                          })}
                        </List>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        </Box>
      </Container>
      <Footer />
    </>
  );
}

export default UserCaloriesPage;
