import { CheckCircleOutlined } from "@ant-design/icons";

export const InfoBar = ({notes}) => {

    const completed = notes.reduce((acc, note) => note.completed ? acc + 1 : acc, 0);

    return (
        <>
            <hr style={styles.hr} />
            <div style={styles.container}>
                
                <h3 style={styles.infobar}>
                    { completed } completed / { notes.length } total
                </h3>
                
                    {completed === notes.length && 
                        <div style={styles.checkMark}>
                            <CheckCircleOutlined />
                        </div>
                    }
                
            </div>
            <hr style={styles.hr} /> 
        </>
    );
};

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        width: "100%"
    },
    infobar: {
        marginRight: 10,
        marginBottom: 0
    },
    checkMark: {
        color: "#00ffff",
        width: 0
    }
};