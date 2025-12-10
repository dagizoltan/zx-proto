
export const createTaskExecution = (data) => {
  const {
    id,
    taskId,
    handlerKey,
    startTime = new Date(),
    endTime = null,
    status = 'RUNNING', // RUNNING, SUCCESS, FAILURE
    logs = [], // Array of strings or objects
    error = null,
  } = data;

  return Object.freeze({
    id,
    taskId,
    handlerKey,
    startTime: new Date(startTime),
    endTime: endTime ? new Date(endTime) : null,
    status,
    logs,
    error,

    toJSON: () => ({
      id,
      taskId,
      handlerKey,
      startTime: new Date(startTime).toISOString(),
      endTime: endTime ? new Date(endTime).toISOString() : null,
      status,
      logs,
      error,
    }),
  });
};
