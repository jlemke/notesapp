

export const InfoBar = ({notes}) => {

    const completed = notes.reduce((acc, note) => note.completed ? acc + 1 : acc, 0);

    return (
        <div>
            <hr/>
            <h3 style={styles.infobar}>
                { completed } completed / { notes.length } total
            </h3>
            <hr/> 
        </div>
    );
};

const styles = {
    infobar: {
        textAlign: "center"
    }
};