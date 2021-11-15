import { answerTask, getCampaignProgress, getTask } from "api/reviews";
import { InformationModal } from "components/Error";
import React, { useEffect, useState } from "react";
import { Redirect, useParams } from "react-router-dom";
import {
  Button,
  Grid,
  Header,
  Label,
  List,
  Message,
  Progress,
  Rating,
  Segment,
} from "semantic-ui-react";
import "./index.css";

const TASK_DESCRIPTIONS = {
  comparison: {
    header: "Comparison Task",
    items: [
      "Select the translation that best matches the source text.",
      "Consider both if the meaning is preserved and if the sentence is well formed.",
    ],
  },
  fluency: {
    header: "Fluency Task",
    items: [
      "Is the output good and fluent?",
      "This involves both grammatical correctness and idiomatic word choices.",
    ],
  },
  adequacy: {
    header: "Adequacy Task",
    items: [
      "Does the output convey the same meaning as the input sentence?",
      "Is part of the message lost, added, or distorted?",
    ],
  },
  directAssessment: {
    header: "Direct Assessment Task",
    items: [
      "Does the translation convey the same meaning as the source, and is it well-formed?",
      "Does it conserve all meaning or is part of the message lost, added, or distorted?",
      "Is the correct terminology used?",
      "Is the translation grammatically correct and fluent?",
    ],
  },
  EESAssessment: {
    header: "Regulatory Text Assessment Task",
    items: [
      "Rate each translation of the source text. For each target, pleaseconsider the following:",
      "Does the translation convey the same meaning as the source, and is it well-formed?",
      "Does it conserve all meaning or is part of the message lost, added, or distorted?",
      "Is the correct terminology used?",
      "Is the translation grammatically correct and in compliance with textual requirements for regulatory translations?",
      "Difference in the number of target texts indicates that some translations were identical",
    ],
  },
};

function TaskWrapper({ description, progress, tasksLeft, children }) {
  return (
    <div>
      {description && (
        <Message size="small" warning>
          <Message.Header>{description.header}</Message.Header>
          <Message.List>
            {description.items.map((item) => (
              <Message.Item key={item.toString()}>{item}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
      <Grid>
        <Grid.Column width={13}>
          <Progress percent={progress} color="olive" progress precision={0} />
        </Grid.Column>
        <Grid.Column align="right" width={3} float="right">
          <Label align="right" color="yellow">
            {tasksLeft} <Label.Detail> tasks left</Label.Detail>
          </Label>
        </Grid.Column>
      </Grid>
      {children}
    </div>
  );
}
const ID_IDX = 0;
const TEXT_IDX = 1;

function ComparisonTask({
  targets,
  source,
  mode,
  tasksLeft,
  progress,
  onSubmit,
}) {
  const [rating, setRating] = useState(300);

  const sendAnswer = () => {
    const answerData = {
      option_1: targets[0][ID_IDX],
      option_2: targets[1][ID_IDX],
      review_value: rating / 100,
      mode,
    };
    setRating(300);
    onSubmit(answerData);
  };

  return (
    <TaskWrapper
      tasksLeft={tasksLeft}
      progress={progress}
      description={TASK_DESCRIPTIONS.comparison}
    >
      <Segment>
        <Header as="h3">Source text</Header>
        <Message size="huge">{source}</Message>
        <Header as="h3">Target texts</Header>
        <Grid columns={2} stackable>
          <Grid.Row stretched>
            <Grid.Column>
              <Segment padded size="large">
                {targets[0][TEXT_IDX]}
              </Segment>
            </Grid.Column>
            <Grid.Column verticalAlign="middle">
              <Segment padded size="large">
                {targets[1][TEXT_IDX]}
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Grid>
          <Grid.Row stretched>
            <Grid.Column>
              <div className="SliderRating">
                <input
                  type="range"
                  min={100}
                  max={500}
                  value={rating}
                  style={{ width: "100%" }}
                  list="tickmarks"
                  onChange={(e) => setRating(e.target.value)}
                />
                <datalist id="tickmarks">
                  <option>100</option>
                  <option>200</option>
                  <option>300</option>
                  <option>400</option>
                  <option>500</option>
                </datalist>
              </div>
              <div className="SliderRatingSubtext">
                <div>Left translation better</div>
                <div>Both translations equal</div>
                <div>Right translation better</div>
              </div>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>
            <Grid.Column>
              <Button size="medium" onClick={sendAnswer} fluid color="blue">
                Select
              </Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </TaskWrapper>
  );
}

function RatingTask({
  targets,
  source,
  mode,
  onSubmit,
  description,
  tasksLeft,
  progress,
}) {
  const [rating, setRating] = useState(0);
  const targetId = targets[0][ID_IDX];
  const targetText = targets[0][TEXT_IDX];

  function sendAnswer(value) {
    const answerData = {
      target_id: targetId,
      review_value: value / 100,
      mode,
    };
    onSubmit(answerData);
    setRating(0);
  }
  return (
    <TaskWrapper {...{ progress, tasksLeft, description }}>
      <Segment>
        <Header as="h3">Source text</Header>
        <Message size="huge">{source}</Message>
        <Header as="h3">Target text</Header>
        <Message size="huge">{targetText}</Message>

        <Segment padded size="large">
          <Grid verticalAlign="middle" columns={2}>
            <Grid.Row key={1}>
              <Grid.Column width={7}>
                {mode === "adequacy" && (
                  <List>
                    <List.Item>5. All meaning</List.Item>
                    <List.Item>4. Most meaning</List.Item>
                    <List.Item>3. Much meaning</List.Item>
                    <List.Item>2. Little meaning</List.Item>
                    <List.Item>1. No meaning</List.Item>
                  </List>
                )}
                {mode === "fluency" && (
                  <List>
                    <List.Item>5. Flawless text</List.Item>
                    <List.Item>4. Good text</List.Item>
                    <List.Item>3. Non-native text</List.Item>
                    <List.Item>2. Disfluent text</List.Item>
                    <List.Item>1. Incomprehensible</List.Item>
                  </List>
                )}
                {mode === "direct_assessment" && (
                  <List>
                    <List.Item>5. Perfect or near perfect</List.Item>
                    <List.Item>4. Very good, some minor issues</List.Item>
                    <List.Item>3. Decent, but contains some issues</List.Item>
                    <List.Item>
                      2. Poor, serious errors in the translation
                    </List.Item>
                    <List.Item>
                      1. Very poor, doesn&#39;t reflect the source text at all
                    </List.Item>
                  </List>
                )}
              </Grid.Column>
              <Grid.Column width={9}>
                <br />
                <div className="SliderRating">
                  <input
                    type="range"
                    min={100}
                    max={500}
                    value={rating}
                    style={{ width: "100%" }}
                    list="tickmarks"
                    onChange={(e) => setRating(e.target.value)}
                  />
                  <datalist id="tickmarks">
                    <option>100</option>
                    <option>200</option>
                    <option>300</option>
                    <option>400</option>
                    <option>500</option>
                  </datalist>
                  {rating / 100} / 5
                </div>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        {rating === 0 && (
          <Button disabled fluid color="blue">
            Submit
          </Button>
        )}
        {rating !== 0 && (
          <Button onClick={() => sendAnswer(rating)} fluid color="blue">
            Submit
          </Button>
        )}
      </Segment>
    </TaskWrapper>
  );
}

function RateMultipleTask({
  targets,
  source,
  mode,
  onSubmit,
  description,
  tasksLeft,
  progress,
  maxStars,
}) {
  const [ratings, setRatings] = useState({});
  function sendAnswers() {
    const answerData = {
      ratings,
      mode,
    };
    onSubmit(answerData);
    setRatings({});
  }
  return (
    <TaskWrapper {...{ progress, tasksLeft, description }}>
      <Segment>
        <Header as="h3">Source text</Header>
        <Message size="huge">{source}</Message>
        <Header as="h3">Target texts</Header>
        {targets.map((target) => (
          <Segment key={target[ID_IDX]}>
            <Message size="huge"> {target[TEXT_IDX]}</Message>
            <Rating
              float="right"
              key={target[ID_IDX]}
              rating={ratings[target[ID_IDX]]}
              // eslint-disable-next-line no-shadow
              onRate={(_e, { rating }) =>
                setRatings({ ...ratings, [target[ID_IDX]]: rating })
              }
              maxRating={maxStars}
              icon="star"
              size="massive"
            />{" "}
            {ratings[target[ID_IDX]] || "0"} / {maxStars}
          </Segment>
        ))}
        <Segment padded size="large">
          <Grid verticalAlign="middle" columns={2}>
            <Grid.Row key={1}>
              <Grid.Column width={10}>
                {mode === "ees_assessment" && (
                  <List>
                    <List.Item>
                      4. Perfect or near perfect (minor typographical errors
                      only)
                    </List.Item>
                    <List.Item>
                      3. Very good, can be post-edited quickly
                    </List.Item>
                    <List.Item>
                      2. Poor, requires significant post-editing
                    </List.Item>
                    <List.Item>1. Very poor, requires retranslation</List.Item>
                  </List>
                )}
              </Grid.Column>
              <Grid.Column width={6}>
                <br />
                <br />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Segment>
        {Object.keys(ratings).length < Object.keys(targets).length && (
          <Button disabled fluid color="blue">
            Submit
          </Button>
        )}
        {Object.keys(ratings).length === Object.keys(targets).length && (
          <Button onClick={() => sendAnswers()} fluid color="blue">
            Submit
          </Button>
        )}
      </Segment>
    </TaskWrapper>
  );
}

function FluencyTask({ mode, source, tasksLeft, progress, targets, onSubmit }) {
  return (
    <RatingTask
      {...{
        description: TASK_DESCRIPTIONS.fluency,
        mode,
        source,
        targets,
        tasksLeft,
        progress,
        onSubmit,
      }}
    />
  );
}

function AdequacyTask({
  mode,
  source,
  targets,
  tasksLeft,
  progress,
  onSubmit,
}) {
  return (
    <RatingTask
      {...{
        description: TASK_DESCRIPTIONS.adequacy,
        mode,
        source,
        targets,
        tasksLeft,
        progress,
        onSubmit,
      }}
    />
  );
}

function DirectAssessmentTask({
  mode,
  source,
  targets,
  tasksLeft,
  progress,
  onSubmit,
}) {
  return (
    <RatingTask
      {...{
        description: TASK_DESCRIPTIONS.directAssessment,
        mode,
        source,
        targets,
        tasksLeft,
        progress,
        onSubmit,
      }}
    />
  );
}

function EESAssessmentTask({
  mode,
  source,
  targets,
  tasksLeft,
  progress,
  onSubmit,
}) {
  return (
    <RateMultipleTask
      {...{
        description: TASK_DESCRIPTIONS.EESAssessment,
        mode,
        source,
        targets,
        tasksLeft,
        progress,
        onSubmit,
        maxStars: 4,
      }}
    />
  );
}

function CampaignTask() {
  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(1);
  const { id, mode } = useParams();
  const progress = Math.floor(100 * (tasksDone / tasksTotal));
  const [error, setError] = useState(false);
  const [task, setTask] = useState(null);
  useEffect(() => {
    let isCancelled = false;
    async function fetchTask() {
      const response = await getTask(id, mode);
      if (!isCancelled) {
        if (response.data.error) {
          setTasksTotal(0);
          setTasksDone(0);
        } else {
          let sum = 0;
          if (response.data.mode === "ees_assessment") {
            // need the total number of targets for each source for calculating tasks done
            sum = response.data.targets.reduce(
              (total, elem) => total + elem[0].length,
              sum
            );
          } else if (response.data.mode === "comparison") {
            sum = 1;
          } else {
            sum = response.data.targets.length; // general case
          }
          setTask({
            mode: response.data.mode,
            source: response.data.source,
            targets: response.data.targets, // List[Tuple[id,target]]
            target_count: sum,
          });
        }
      }
    }
    fetchTask();
    // eslint-disable-next-line no-return-assign
    return () => (isCancelled = true);
  }, [id, mode, tasksDone]);

  useEffect(() => {
    getCampaignProgress(id).then((response) => {
      setTasksTotal(response.data[mode].total);
      setTasksDone(response.data[mode].completed);
    });
  }, [id, mode]); // We do not re-render this, just so that we don't spam the server.

  if (tasksDone >= tasksTotal) {
    return <Redirect to="/campaigns" />;
  }

  if (task === null) {
    return <></>;
  }

  const answer = (answerData) => {
    answerTask(id, answerData)
      .then(() => {
        setTasksDone(tasksDone + task.target_count);
      })
      .catch((err) => {
        setError(true);
        console.log(err);
      });
  };

  if (error) {
    return (
      <InformationModal
        header="Something went wrong"
        message="Please check your internet connection or be in touch if the problem persists."
      />
    );
  }

  return (
    <>
      {task.mode === "comparison" && (
        <ComparisonTask
          mode={mode}
          source={task.source}
          tasksLeft={tasksTotal - tasksDone}
          progress={progress}
          targets={task.targets}
          onSubmit={answer}
        />
      )}
      {task.mode === "fluency" && (
        <FluencyTask
          mode={mode}
          source={task.source}
          tasksLeft={tasksTotal - tasksDone}
          progress={progress}
          targets={task.targets}
          onSubmit={answer}
        />
      )}
      {task.mode === "direct_assessment" && (
        <DirectAssessmentTask
          mode={mode}
          source={task.source}
          tasksLeft={tasksTotal - tasksDone}
          progress={progress}
          targets={task.targets}
          onSubmit={answer}
        />
      )}
      {task.mode === "ees_assessment" && (
        <EESAssessmentTask
          mode={mode}
          source={task.source}
          tasksLeft={tasksTotal - tasksDone}
          progress={progress}
          targets={task.targets}
          onSubmit={answer}
        />
      )}
      {task.mode === "adequacy" && (
        <AdequacyTask
          mode={mode}
          source={task.source}
          tasksLeft={tasksTotal - tasksDone}
          progress={progress}
          targets={task.targets}
          onSubmit={answer}
        />
      )}
    </>
  );
}

export default CampaignTask;
