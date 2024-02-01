import { useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck, faUndo } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import { db } from './firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      const tasksCollection = collection(db, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollection);
      const tasksData = tasksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    };

    fetchTasks();
  }, []);

  const addTask = async () => {
    if (newTask.trim() !== '') {
      const tasksCollection = collection(db, 'tasks');
      const newTaskItem = { text: newTask, completed: false };

      const docRef = await addDoc(tasksCollection, newTaskItem);
      setTasks([...tasks, { id: docRef.id, ...newTaskItem }]);
      setNewTask('');
    }
  };

  const removeTask = async (taskId) => {
    const tasksCollection = collection(db, 'tasks');
    await deleteDoc(doc(tasksCollection, taskId));

    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const toggleTaskStatus = async (taskId) => {
    const tasksCollection = collection(db, 'tasks');
    const taskDoc = doc(tasksCollection, taskId);
    const taskSnapshot = await getDoc(taskDoc);
    const taskData = taskSnapshot.data();

    if (taskData) {
      const updatedTask = { ...taskData, completed: !taskData.completed };
      await updateDoc(taskDoc, updatedTask);

      const updatedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, completed: updatedTask.completed } : task
      );
      setTasks(updatedTasks);
    }
  };

  const moveTaskToTop = async (taskId) => {
    const reorderedTasks = Array.from(tasks);
    const movedTask = reorderedTasks.find((task) => task.id === taskId);
    reorderedTasks.splice(reorderedTasks.indexOf(movedTask), 1);
    reorderedTasks.unshift(movedTask);

    const updatedTasks = await updateTasksOrder(reorderedTasks);
    setTasks(updatedTasks);
  };

  const moveTaskToBottom = async (taskId) => {
    const reorderedTasks = Array.from(tasks);
    const movedTask = reorderedTasks.find((task) => task.id === taskId);
    reorderedTasks.splice(reorderedTasks.indexOf(movedTask), 1);
    reorderedTasks.push(movedTask);

    const updatedTasks = await updateTasksOrder(reorderedTasks);
    setTasks(updatedTasks);
  };

  const moveTask = async (taskId, direction) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0) {
      return moveTaskToTop(taskId);
    } else if (newIndex >= tasks.length) {
      return moveTaskToBottom(taskId);
    }

    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(index, 1);
    reorderedTasks.splice(newIndex, 0, movedTask);

    const updatedTasks = await updateTasksOrder(reorderedTasks);
    setTasks(updatedTasks);
  };

  const updateTasksOrder = async (updatedOrder) => {
    const updatedTasks = await Promise.all(
      updatedOrder.map(async (task, index) => {
        const tasksCollection = collection(db, 'tasks');
        const taskDoc = doc(tasksCollection, task.id);
        await updateDoc(taskDoc, { order: index });
        return { ...task, order: index };
      })
    );

    return updatedTasks;
  };

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (source.index === destination.index) {
      return;
    }

    if (destination.index === 0) {
      return moveTaskToTop(tasks[source.index].id);
    } else if (destination.index === tasks.length - 1) {
      return moveTaskToBottom(tasks[source.index].id);
    }

    const reorderedTasks = Array.from(tasks);
    const [removed] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, removed);

    const updatedTasks = await updateTasksOrder(reorderedTasks);
    setTasks(updatedTasks);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="App">
      <div>
        <h4>{currentDate}</h4>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter a task"
        />
        <button onClick={addTask}>Add Task</button>
        <div className="task-counts">
          <p>
            Active Tasks: {tasks.filter((task) => !task.completed).length}{' '}
            <span className="icons-container">
              <FontAwesomeIcon icon={faCheck} className="fa-check" />
              Complete
            </span>
          </p>
          <p>
            Incomplete Tasks: {tasks.length - tasks.filter((task) => task.completed).length}{' '}
            <span className="icons-container">
              <FontAwesomeIcon icon={faCheck} className="fa-check" />
              Complete
            </span>
          </p>
          <p>
            Complete Tasks: {tasks.filter((task) => task.completed).length}{' '}
            <span className="icons-container">
              <FontAwesomeIcon icon={faUndo} className="fa-undo" />
              Undo
            </span>
          </p>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef}>
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={task.completed ? 'completed' : ''}
                      >
                        <div className="icons-container">
                          <button onClick={() => toggleTaskStatus(task.id)}>
                            {task.completed ? (
                              <>
                                <FontAwesomeIcon icon={faUndo} className="fa-undo" />
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faCheck} className="fa-check" />
                              </>
                            )}
                          </button>
                        </div>
                        {task.text}
                        <div className="task-buttons">
                          <button onClick={() => moveTask(task.id, 'up')}>
                            Move Up
                          </button>
                          <button onClick={() => moveTask(task.id, 'down')}>
                            Move Down
                          </button>
                          <button onClick={() => removeTask(task.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default TodoApp;
